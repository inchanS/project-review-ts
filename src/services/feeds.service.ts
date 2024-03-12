import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FeedRepository } from '../repositories/feed.repository';
import { FeedDto } from '../entities/dto/feed.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';
import { Feed } from '../entities/feed.entity';
import dataSource from '../repositories/data-source';
import { EntityNotFoundError, QueryRunner } from 'typeorm';
import { Estimation } from '../entities/estimation.entity';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { UploadFileService } from './uploadFile.service';
import { UploadService } from './upload.service';
import { CustomError } from '../utils/util';
import { FeedListRepository } from '../repositories/feedList.repository';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';

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
  public getTempFeedList = async (userId: number): Promise<FeedList[]> => {
    const results: FeedList[] =
      await this.feedListRepository.getFeedListByUserId(userId, undefined, {
        onlyTempFeeds: true,
      });

    // forEach, map, for 루프 등의 방법들 중
    // 큰 차이는 없겠지만 불필요한 메모리낭비를 제거하기 위해 map은 제외, (아래는 map 메소드 사용시 코드)
    // results.map(result => this.updateTitle(result));

    // for 루프보다는 가독성이 더 낫다고 판단하여 forEach 선택 (아래는 for 루프 메소드 사용시 코드)
    // for (const result of results) {
    //   this.updateTitle(result);
    // }

    results.forEach(result => this.updateTitle(result));

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
    const queryRunner: QueryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 수정된 feed 저장
      const feed: Feed = plainToInstance(Feed, feedInfo);

      // 수정내용 중 fileLink가 있는지 확인하고, 있다면 uploadFile에 feed의 ID를 연결해주는 함수
      // fildLink가 없다면 기존의 fileLink를 삭제한다.
      await this.uploadFileService.checkUploadFileOfFeed(
        queryRunner,
        Number(feed.user),
        originFeed,
        fileLinks
      );

      const newFeed: Feed = await queryRunner.manager
        .withRepository(this.feedRepository)
        .updateFeed(feedId, feed, queryRunner);

      await queryRunner.commitTransaction();

      const result: Feed = await this.feedRepository.getFeed(newFeed.id, {
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
  ): Promise<Feed | undefined> => {
    // typeORM에서 제공하는 EntityNotFoundError를 사용하여 존재하지 않거나 삭제된 feedId에 대한 에러처리
    const feed: Feed | void = await this.feedRepository
      .getFeed(feedId, options)
      .catch((err: Error): void => {
        if (err instanceof EntityNotFoundError) {
          throw new CustomError(404, `NOT_FOUND_FEED`);
        }
      });

    if (feed) {
      // 제목이 없는 임시게시글의 경우 최근 수정일을 제목으로 대신하는 함수 호출
      this.updateTitle(feed);

      // 임시저장 게시글은 본인만 볼 수 있음
      if (feed.status.id === 2 && feed.user.id !== userId) {
        throw new CustomError(403, `UNAUTHORIZED_TO_ACCESS_THE_POST`);
      }

      // 등록된 정식 게시글의 경우 호출시 조회수 +1 증가
      if (feed.status.id === 1) {
        await this.feedRepository.addViewCount(feedId);
      }
      return feed;
    }
    return;
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
    const feed: Feed | void = await this.feedRepository
      .getFeed(feedId, { isAll: true })
      .catch((err: Error): void => {
        if (err instanceof EntityNotFoundError) {
          throw new CustomError(404, `NOT_FOUND_FEED`);
        }
      });

    const feedToDelete: Feed = feed!;

    // 사용자 유효성 검사
    if (feedToDelete.user.id !== userId) {
      throw new CustomError(403, 'ONLY_THE_AUTHOR_CAN_DELETE');
    }

    // transaction으로 묶어주기
    const queryRunner: QueryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (feedToDelete.uploadFiles && feedToDelete.uploadFiles.length > 0) {
        const deleteFileLinksArray: string[] = [];

        // 게시물의 모든 uploadFile 삭제
        for (const uploadFile of feedToDelete.uploadFiles) {
          deleteFileLinksArray.push(uploadFile.file_link);
        }
        await this.uploadService
          .deleteUploadFile(userId, deleteFileLinksArray, queryRunner)
          .catch(err => {
            throw new Error(`deleteUploadFile error: ${err}`);
          });
      }

      feedToDelete.status.id = 3;
      await queryRunner.manager.update(
        Feed,
        { id: feedId },
        { status: feedToDelete.status }
      );

      await queryRunner.manager.softDelete(Feed, { id: feedId });

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

  updateTitle = (item: Feed | FeedList) => {
    let updatedAt: string | undefined;

    if (item instanceof Feed) {
      updatedAt = item.updated_at.toString().substring(2);
    } else if (item instanceof FeedList) {
      updatedAt = item.updatedAt.toString().substring(2);
    }

    if (updatedAt !== undefined) {
      item.title = item.title ?? `${updatedAt}에 임시저장된 글입니다.`;
    } else {
      console.error('Unable to update title due to undefined updatedAt.');
      item.title = item.title ?? '정의되지 않은 날짜에 임시저장된 글입니다.';
    }
  };
}
