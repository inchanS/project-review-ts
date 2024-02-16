import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { FeedOption, FeedRepository } from '../repositories/feed.repository';
import { FeedDto } from '../entities/dto/feed.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';
import { Feed } from '../entities/feed.entity';
import dataSource from '../repositories/data-source';
import { EntityNotFoundError, QueryRunner } from 'typeorm';
import { Estimation } from '../entities/estimation.entity';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { DeleteUploadFiles, UploadFileService } from './uploadFile.service';
import { UploadService } from './upload.service';
import { CustomError } from '../utils/util';
import { FeedListRepository } from '../repositories/feedList.repository';
import { DateUtils } from '../utils/dateUtils';

export class FeedsService {
  private feedRepository: FeedRepository;
  private feedListRepository: FeedListRepository;
  private uploadFileService: UploadFileService;
  private uploadService: UploadService;

  constructor() {
    this.feedRepository = FeedRepository.getInstance();
    this.feedListRepository = FeedListRepository.getInstance();
    this.uploadFileService = new UploadFileService();
    this.uploadService = new UploadService();
  }

  // 임시저장 ==================================================================
  // 임시저장 게시글 리스트 --------------------------------------------------------
  // FIXME type any 고치기
  public getTempFeedList = async (userId: number) => {
    const results: any = await this.feedListRepository.getFeedListByUserId(
      userId,
      undefined,
      {
        onlyTempFeeds: true,
      }
    );

    for (const result of results) {
      const updatedAt = result.updatedAt.substring(2);
      result.title = result.title ?? `${updatedAt}에 임시저장된 글입니다.`;
    }

    return results;
  };

  // 임시저장 및 게시글 저장 -----------------------------------------------------------
  private maxTransactionAttempts: number = 3;
  private executeTransactionWithRetry = async (
    attempt: number,
    feedInfo: TempFeedDto | FeedDto,
    fileLinks: string[],
    options?: FeedOption
  ): Promise<Feed> => {
    const queryRunner: QueryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newFeedInstance: Feed = plainToInstance(Feed, feedInfo);
      const newFeed: Feed = await queryRunner.manager
        .withRepository(this.feedRepository)
        .createFeed(newFeedInstance, queryRunner);

      // TODO 아래 로직을 따로 handleFileOperations 함수로 분리하기
      if (fileLinks && fileLinks.length > 0) {
        await this.uploadFileService.updateFileLinks(
          queryRunner,
          newFeed,
          fileLinks
        );

        const deleteUploadFiles: DeleteUploadFiles | undefined =
          await this.uploadFileService.deleteUnusedUploadFiles(
            queryRunner,
            Number(newFeedInstance.user)
          );

        if (deleteUploadFiles) {
          await this.uploadFileService.deleteUnconnectedLinks(
            queryRunner,
            deleteUploadFiles.uploadFileWithoutFeedId,
            deleteUploadFiles.deleteFileLinksArray,
            Number(newFeedInstance.user)
          );
        }
      }

      await queryRunner.commitTransaction();

      const result: Feed = await this.feedRepository.getFeed(
        newFeed.id,
        options
      );
      return result;
    } catch (err: any) {
      await queryRunner.rollbackTransaction();

      if (
        err.message.includes('Lock wait timeout') &&
        attempt < this.maxTransactionAttempts
      ) {
        console.log(`createFeed TRANSACTION retry: ${attempt}`);
        return await this.executeTransactionWithRetry(
          attempt + 1,
          feedInfo,
          fileLinks,
          options
        );
      } else {
        throw new CustomError(
          err.status,
          `createFeed TRANSACTION error: ${err.message}`
        );
      }
    } finally {
      await queryRunner.release();
    }
  };

  public createFeed = async (
    feedInfo: TempFeedDto | FeedDto,
    fileLinks: string[],
    options?: FeedOption
  ): Promise<Feed> => {
    if (feedInfo.status === 2) {
      feedInfo = plainToInstance(TempFeedDto, feedInfo);
    } else {
      feedInfo = plainToInstance(FeedDto, feedInfo);
      feedInfo.posted_at = new Date();
    }

    await validateOrReject(feedInfo).catch(errors => {
      throw { status: 500, message: errors[0].constraints };
    });

    const result: Feed = await this.executeTransactionWithRetry(
      1,
      feedInfo,
      fileLinks,
      options
    );

    return result;
  };

  // 임시게시글 및 게시글 수정 -----------------------------------------------------------
  public updateFeed = async (
    userId: number,
    feedInfo: TempFeedDto | FeedDto,
    feedId: number,
    fileLinks: string[],
    options?: FeedOption
  ): Promise<Feed> => {
    // 수정 전 기존 feed 정보
    const originFeed: Feed = await this.feedRepository
      .getFeed(feedId, options)
      .catch(() => {
        throw new CustomError(404, 'NOT_FOUND_FEED');
      });

    if (originFeed.user.id !== userId) {
      throw new CustomError(403, 'ONLY_THE_AUTHOR_CAN_EDIT');
    }

    if (originFeed.status?.id === 2 && feedInfo.status === 1) {
      feedInfo = plainToInstance(FeedDto, feedInfo);
      feedInfo.posted_at = new Date();
    } else if (originFeed.status?.id === 2) {
      feedInfo = plainToInstance(TempFeedDto, feedInfo);
    } else {
      feedInfo = plainToInstance(FeedDto, feedInfo);
    }

    await validateOrReject(feedInfo).catch(errors => {
      throw new CustomError(500, errors[0].constraints);
    });

    // transaction으로 묶어주기
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 수정된 feed 저장
      const feed = plainToInstance(Feed, feedInfo);

      // 수정내용 중 fileLink가 있는지 확인하고, 있다면 uploadFile에 feed의 ID를 연결해주는 함수
      // fildLink가 없다면 기존의 fileLink를 삭제한다.
      await this.uploadFileService.checkUploadFileOfFeed(
        queryRunner,
        Number(feed.user),
        originFeed,
        fileLinks
      );

      const newFeed = await queryRunner.manager
        .withRepository(this.feedRepository)
        .updateFeed(feedId, feed, queryRunner);

      await queryRunner.commitTransaction();

      const result = await this.feedRepository.getFeed(newFeed.id, {
        isAll: true,
      });

      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(`updateFeed TRANSACTION error: ${err}`);
    } finally {
      await queryRunner.release();
    }
  };

  // 게시글 가져오기 --------------------------------------------------------
  public getFeed = async (
    userId: number,
    feedId: number,
    options?: FeedOption
  ) => {
    // typeORM에서 제공하는 EntityNotFoundError를 사용하여 존재하지 않거나 삭제된 feedId에 대한 에러처리
    // FIXME type any 고치기
    const result: any = await this.feedRepository
      .getFeed(feedId, options)
      .catch((err: Error) => {
        if (err instanceof EntityNotFoundError) {
          throw new CustomError(404, `NOT_FOUND_FEED`);
        }
      });

    // feed 값 재가공
    result.created_at = DateUtils.formatDate(result.created_at);
    result.updated_at = DateUtils.formatDate(result.updated_at);
    result.posted_at = result.posted_at
      ? DateUtils.formatDate(result.posted_at)
      : null;

    const updatedAt = result.updated_at.substring(2);
    result.title = result.title ?? `${updatedAt}에 임시저장된 글입니다.`;

    // 임시저장 게시글은 본인만 볼 수 있음
    if (result.status.id === 2 && result.user.id !== userId) {
      throw new CustomError(403, `UNAUTHORIZED_TO_ACCESS_THE_POST`);
    }

    // 등록된 정식 게시글의 경우 호출시 조회수 +1 증가
    if (result.status.id === 1) {
      await this.feedRepository.addViewCount(feedId);
    }

    return result;
  };

  // 게시글 리스트 --------------------------------------------------------------
  public getFeedList = async (
    categoryId: number | undefined,
    index: number,
    limit: number
  ): Promise<FeedList[]> => {
    // query로 전달된 categoryId가 0이거나 없을 경우 undefined로 변경 처리
    if (!categoryId || categoryId === 0) {
      categoryId = undefined;
    }

    // query로 전달된 limit가 0이거나 없을 경우 기본값 10으로 변경 처리
    if (!limit || limit === 0) {
      limit = 10;
    }

    if (!index) {
      index = 0;
    }

    return await this.feedListRepository.getFeedList(categoryId, index, limit);
  };

  public deleteFeed = async (userId: number, feedId: number): Promise<void> => {
    // FIXME type any 고치기
    const feed: any = await this.feedRepository
      .getFeed(feedId, { isAll: true })
      .catch((err: Error) => {
        if (err instanceof EntityNotFoundError) {
          throw new CustomError(404, `NOT_FOUND_FEED`);
        }
      });

    // 사용자 유효성 검사
    if (feed.user.id !== userId) {
      throw new CustomError(403, 'ONLY_THE_AUTHOR_CAN_DELETE');
    }

    // transaction으로 묶어주기
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (feed.uploadFiles.length > 0) {
        const deleteFileLinksArray = [];
        // feeds.service에서 본 함수를 사용할때, mySQL의 테이블에서 삭제하는 로직은 필요가 없기때문에 구분 조건을 만들어준다.
        deleteFileLinksArray.push('DELETE_FROM_UPLOAD_FILES_TABLE');

        // 게시물의 모든 uploadFile 삭제
        for (const uploadFile of feed.uploadFiles) {
          deleteFileLinksArray.push(uploadFile.file_link);
        }
        await this.uploadService
          .deleteUploadFile(userId, deleteFileLinksArray)
          .catch(err => {
            throw new Error(`deleteUploadFile error: ${err}`);
          });
      }

      // FIXME feed 삭제시 feed.status.id를 3(deleted)으로 변경하는 로직이 추가되어야 한다.
      //  아래 transaction 코드 확인해보기 20240207
      feed.status = 3;
      await queryRunner.manager.update(
        Feed,
        { id: feedId },
        { status: feed.status }
      );
      await queryRunner.manager.softDelete(Feed, { id: feedId });

      // feed 삭제
      // await queryRunner.manager.softDelete(Feed, feedId);

      // feedSymbol 삭제
      await queryRunner.manager.softDelete(FeedSymbol, { feed: feedId });

      await queryRunner.commitTransaction();
      return;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(`deleteFeed TRANSACTION error: ${err}`);
    } finally {
      await queryRunner.release();
    }
  };

  public getEstimations = async (): Promise<Estimation[]> => {
    return await dataSource
      .getRepository(Estimation)
      .find({ select: ['id', 'estimation'] });
  };
}
