import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import {
  FeedListRepository,
  FeedRepository,
} from '../repositories/feed.repository';
import { FeedDto } from '../entities/dto/feed.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';
import { Feed } from '../entities/feed.entity';
import dataSource from '../repositories/data-source';
import { EntityNotFoundError } from 'typeorm';
import uploadFileService, { DeleteUploadFiles } from './uploadFile.service';
import { Estimation } from '../entities/estimation.entity';
import uploadService from './upload.service';
import { FeedSymbol } from '../entities/feedSymbol.entity';
import { FeedOption } from '../repositories/feed.repository';

// 임시저장 ==================================================================
// 임시저장 게시글 리스트 --------------------------------------------------------
const getTempFeedList = async (userId: number) => {
  const results = await FeedListRepository.getFeedListByUserId(userId, {
    onlyTempFeeds: true,
  });
  for (const result of results) {
    const updatedAt = result.updatedAt.substring(2);
    if (result.title === null) {
      result.title = `${updatedAt}에 임시저장된 글입니다.`;
    }
  }
  return results;
};

// 임시저장 및 게시글 저장 -----------------------------------------------------------
const maxTransactionAttempts = 3;
const executeTransactionWithRetry = async (
  attempt: number,
  feedInfo: TempFeedDto | FeedDto,
  fileLinks: string[],
  options: FeedOption
): Promise<Feed> => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const newFeedInstance = plainToInstance(Feed, feedInfo);
    const newFeed = await queryRunner.manager
      .withRepository(FeedRepository)
      .createFeed(newFeedInstance);

    if (fileLinks) {
      await uploadFileService.updateFileLinks(queryRunner, newFeed, fileLinks);

      const deleteUploadFiles: DeleteUploadFiles =
        await uploadFileService.deleteUnusedUploadFiles(
          queryRunner,
          Number(newFeedInstance.user)
        );

      if (deleteUploadFiles) {
        await uploadFileService.deleteUnconnectedLinks(
          queryRunner,
          deleteUploadFiles.uploadFileWithoutFeedId,
          deleteUploadFiles.deleteFileLinksArray,
          Number(newFeedInstance.user)
        );
      }
    }

    const result: Feed = await queryRunner.manager
      .withRepository(FeedRepository)
      .getFeed(newFeed.id, options);

    await queryRunner.commitTransaction();
    return result;
  } catch (err: any) {
    await queryRunner.rollbackTransaction();

    if (
      err.message.includes('Lock wait timeout') &&
      attempt < maxTransactionAttempts
    ) {
      console.log(`createFeed TRANSACTION retry: ${attempt}`);
      return await executeTransactionWithRetry(
        attempt + 1,
        feedInfo,
        fileLinks,
        options
      );
    } else {
      throw new Error(`createFeed TRANSACTION error: ${err}`);
    }
  }
};

const createFeed = async (
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

  const result = await executeTransactionWithRetry(
    1,
    feedInfo,
    fileLinks,
    options
  );

  return result;
};

// 임시게시글 및 게시글 수정 -----------------------------------------------------------
const updateFeed = async (
  userId: number,
  feedInfo: TempFeedDto | FeedDto,
  feedId: number,
  fileLinks: string[],
  options?: FeedOption
): Promise<Feed> => {
  // 수정 전 기존 feed 정보
  const originFeed = await FeedRepository.getFeed(feedId, options).catch(() => {
    throw { status: 404, message: 'NOT_FOUND_FEED' };
  });

  if (originFeed.user.id !== userId) {
    const error = new Error('ONLY_THE_AUTHOR_CAN_EDIT');
    error.status = 403;
    throw error;
  }

  if (originFeed.status.id === 2 && feedInfo.status === 1) {
    feedInfo = plainToInstance(FeedDto, feedInfo);
    feedInfo.posted_at = new Date();
  } else if (originFeed.status.id === 2) {
    feedInfo = plainToInstance(TempFeedDto, feedInfo);
  } else {
    feedInfo = plainToInstance(FeedDto, feedInfo);
  }

  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
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

    await uploadFileService.checkUploadFileOfFeed(
      queryRunner,
      feedId,
      Number(feed.user),
      originFeed,
      fileLinks
    );

    const newFeed = await queryRunner.manager
      .withRepository(FeedRepository)
      .updateFeed(feedId, feed);

    const result = await queryRunner.manager
      .withRepository(FeedRepository)
      .getFeed(newFeed.id, { isAll: true });

    await queryRunner.commitTransaction();

    return result;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw new Error(`updateFeed TRANSACTION error: ${err}`);
  } finally {
    await queryRunner.release();
  }
};

// 게시글 가져오기 --------------------------------------------------------
const getFeed = async (
  userId: number,
  feedId: number,
  options?: FeedOption
) => {
  // typeORM에서 제공하는 EntityNotFoundError를 사용하여 존재하지 않거나 삭제된 feedId에 대한 에러처리
  const result = await FeedRepository.getFeed(feedId, options).catch(
    (err: Error) => {
      if (err instanceof EntityNotFoundError) {
        const error = new Error(`NOT_FOUND_FEED`);
        error.status = 404;
        throw error;
      }
    }
  );

  // feed 값 재가공
  result.created_at = result.created_at.substring(0, 19);
  result.updated_at = result.updated_at.substring(0, 19);

  const updatedAt = result.updated_at.substring(2);
  result.title =
    result.title === null
      ? `${updatedAt}에 임시저장된 글입니다.`
      : result.title;

  // 임시저장 게시글은 본인만 볼 수 있음
  if (result.status.id === 2 && result.user.id !== userId) {
    const error = new Error(`UNAUTHORIZED_TO_ACCESS_THE_POST`);
    error.status = 403;
    throw error;
  }

  // 등록된 정식 게시글의 경우 호출시 조회수 +1 증가
  if (result.status.id === 1) {
    await FeedRepository.addViewCount(feedId);
  }

  return result;
};

// 게시글 리스트 --------------------------------------------------------------
const getFeedList = async (
  categoryId: number,
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
    index = 1;
  }
  const startIndex: number = (index - 1) * limit;
  return await FeedListRepository.getFeedList(categoryId, startIndex, limit);
};

const deleteFeed = async (userId: number, feedId: number): Promise<void> => {
  const feed = await FeedRepository.getFeed(feedId, { isAll: true }).catch(
    (err: Error) => {
      if (err instanceof EntityNotFoundError) {
        const error = new Error(`NOT_FOUND_FEED`);
        error.status = 404;
        throw error;
      }
    }
  );

  // 사용자 유효성 검사
  if (feed.user.id !== userId) {
    const error = new Error('ONLY_THE_AUTHOR_CAN_DELETE');
    error.status = 403;
    throw error;
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
      await uploadService
        .deleteUploadFile(userId, deleteFileLinksArray)
        .catch(err => {
          throw new Error(`deleteUploadFile error: ${err}`);
        });
    }

    // feed 삭제
    await queryRunner.manager.softDelete(Feed, feedId);

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

const getEstimations = async (): Promise<Estimation[]> => {
  return await dataSource
    .getRepository(Estimation)
    .find({ select: ['id', 'estimation'] });
};

export default {
  createFeed,
  updateFeed,
  getFeedList,
  getFeed,
  getTempFeedList,
  deleteFeed,
  getEstimations,
};
