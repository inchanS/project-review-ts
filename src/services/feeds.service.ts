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

  public getTempFeedList = async (userId: number): Promise<FeedList[]> => {
    const results: FeedList[] =
      await this.feedListRepository.getFeedListByUserId(userId, undefined, {
        onlyTempFeeds: true,
      });

    results.forEach(result => this.changeTitleToUpdatedAt(result));

    return results;
  };

  // 임시게시글 및 정식 게시글 저장
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

    const transactionAttempt: number = 1;

    return await this.executeTransactionWithRetry(
      transactionAttempt,
      feedInfo,
      fileLinks,
      options
    );
  };

  // 임시게시글 및 게시글 수정 -----------------------------------------------------------
  public updateFeed = async (
    userId: number,
    feedInfo: TempFeedDto | FeedDto,
    feedId: number,
    fileLinks: string[],
    options?: FeedOption
  ): Promise<Feed> => {
    const originFeed: Feed = await this.validateFeedOrUser(
      feedId,
      userId,
      options
    );

    const feedDto: TempFeedDto | FeedDto =
      this.transformFeedInfoDTOBasedOnStatus(originFeed, feedInfo);

    await validateOrReject(feedDto).catch(errors => {
      throw new CustomError(500, errors[0].constraints);
    });

    return await this.executeFeedUpdateTransaction(
      feedDto,
      originFeed,
      fileLinks
    );
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
      // 제목이 없는 '임시게시글'의 경우 최근 수정일을 제목으로 대신하는 함수 호출
      this.changeTitleToUpdatedAt(feed);

      // 임시저장 게시글은 본인만 볼 수 있음
      if (feed.status.id === 2 && feed.user.id !== userId) {
        throw new CustomError(403, `UNAUTHORIZED_TO_ACCESS_THE_POST`);
      }

      // FrontEnd에서 캐싱으로 피드를 불러오게 되면 불필요한 조회수 증가를 막을 수 있다.
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

    const queryRunner: QueryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await Promise.all([
        this.deleteFeedFileLinks(feedToDelete, userId, queryRunner),
        queryRunner.manager.softDelete(FeedSymbol, { feed: feedId }),
        queryRunner.manager.update(Feed, { id: feedId }, { status: { id: 3 } }),
      ]);

      await queryRunner.manager.softDelete(Feed, { id: feedId });

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

  private changeTitleToUpdatedAt = (item: Feed | FeedList) => {
    let updatedAt: string | undefined;

    // FIXME updated_at과 updatedAt은 동일한 성격의 컬럼인데 Feed와 FeedList 테이블에서 컬럼명을 다르게 하는 통에 이런 불필요한 if문이 만들어졌다.
    //  지금와서 바꾸자니 프론트엔드에서도 다 반영해야하기에 일단 놔두고 있다.
    if (item instanceof Feed) {
      updatedAt = item.updated_at.toString().substring(2);
    } else if (item instanceof FeedList) {
      updatedAt = item.updatedAt.toString().substring(2);
    }

    // 로직상 updatedAt이 없다는건 있을 수 없는 일이지만 에러핸들링 차원에서 추가하였다.
    if (updatedAt !== undefined) {
      item.title = item.title ?? `${updatedAt}에 임시저장된 글입니다.`;
    } else {
      console.error('Unable to update title due to undefined updatedAt.');
      item.title = item.title ?? '정의되지 않은 날짜에 임시저장된 글입니다.';
    }
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

      await this.handleFileOperations(queryRunner, newFeed, fileLinks);

      await queryRunner.commitTransaction();

      return await this.feedRepository.getFeed(newFeed.id, options);
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

  private handleFileOperations = async (
    queryRunner: QueryRunner,
    newFeed: Feed,
    fileLinks: string[]
  ) => {
    if (fileLinks && fileLinks.length > 0) {
      await this.uploadFileService.updateFileLinks(
        queryRunner,
        newFeed,
        fileLinks
      );

      const deleteUploadFiles: DeleteUploadFiles | undefined =
        await this.uploadFileService.deleteUnusedUploadFiles(
          queryRunner,
          Number(newFeed.user)
        );

      if (deleteUploadFiles) {
        await this.uploadFileService.deleteUnconnectedLinks(
          queryRunner,
          deleteUploadFiles.uploadFileWithoutFeedId,
          deleteUploadFiles.deleteFileLinksArray,
          Number(newFeed.user)
        );
      }
    }
  };

  private validateFeedOrUser = async (
    feedId: number,
    userId: number,
    options: FeedOption | undefined
  ): Promise<Feed> => {
    const originFeed: Feed = await this.feedRepository
      .getFeed(feedId, options)
      .catch(() => {
        throw new CustomError(404, 'NOT_FOUND_FEED');
      });

    if (originFeed.user.id !== userId) {
      throw new CustomError(403, 'ONLY_THE_AUTHOR_CAN_EDIT');
    }

    return originFeed;
  };

  private transformFeedInfoDTOBasedOnStatus = (
    originFeed: Feed,
    feedInfo: TempFeedDto | FeedDto
  ) => {
    if (originFeed.status.id === 2 && feedInfo.status === 1) {
      feedInfo = plainToInstance(FeedDto, feedInfo);
      feedInfo.posted_at = new Date();
    } else if (originFeed.status.id === 2) {
      feedInfo = plainToInstance(TempFeedDto, feedInfo);
    } else {
      feedInfo = plainToInstance(FeedDto, feedInfo);
    }

    return feedInfo;
  };

  private executeFeedUpdateTransaction = async (
    feedDto: TempFeedDto | FeedDto,
    originFeed: Feed,
    fileLinks: string[]
  ): Promise<Feed> => {
    const queryRunner: QueryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 수정된 feed 저장
      const newFeed: Feed = plainToInstance(Feed, feedDto);

      // 수정내용 중 fileLink가 있는지 확인하고, 있다면 uploadFile에 feed의 ID를 연결해주는 함수
      // fildLink가 없다면 기존의 fileLink를 삭제한다.

      await Promise.all([
        this.uploadFileService.checkUploadFileOfFeed(
          queryRunner,
          Number(newFeed.user),
          originFeed,
          fileLinks
        ),
        queryRunner.manager.update(Feed, originFeed.id, newFeed),
      ]);

      await queryRunner.commitTransaction();

      return await this.feedRepository.getFeed(originFeed.id, {
        isAll: true,
      });
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw new CustomError(
        500,
        `updateFeed TRANSACTION error: ${err.message || err}`
      );
    } finally {
      await queryRunner.release();
    }
  };

  private deleteFeedFileLinks = async (
    feedToDelete: Feed,
    userId: number,
    queryRunner: QueryRunner
  ) => {
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
  };
}
