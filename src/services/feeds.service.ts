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
import dataSource from '../repositories/index.db';
import { QueryRunner } from 'typeorm';
import { Estimation } from '../entities/estimation.entity';
import uploadFileService, { DeleteUploadFiles } from './uploadFile.service';

// 임시저장 ==================================================================
// 임시저장 게시글 리스트 --------------------------------------------------------
const getTempFeedList = async (userId: number) => {
  const results = await FeedListRepository.getTempFeedList(userId);
  for (const result of results) {
    const updatedAt = result.updatedAt.substring(2);
    if (result.title === null) {
      result.title = `${updatedAt}에 임시저장된 글입니다.`;
    }
  }
  return results;
};

// 임시저장 게시글 저장 -----------------------------------------------------------

const getTempFeed = async (
  queryRunner: QueryRunner,
  tempFeedId: number
): Promise<Feed> => {
  return await queryRunner.manager
    .withRepository(FeedRepository)
    .getFeed(tempFeedId);
};

// -----------------------------------------------------------

const createFeed = async (
  feedInfo: TempFeedDto | FeedDto,
  fileLinks: string[]
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

  // transaction으로 묶어주기
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // feed 저장
    const tempFeed = plainToInstance(Feed, feedInfo);
    const newTempFeed = await queryRunner.manager
      .withRepository(FeedRepository)
      .createFeed(tempFeed);

    // uploadFile에 feed의 ID를 연결해주는 함수
    if (fileLinks) {
      await uploadFileService.updateFileLinks(
        queryRunner,
        newTempFeed,
        fileLinks
      );
      const deleteUploadFiles: DeleteUploadFiles =
        await uploadFileService.deleteUnusedUploadFiles(queryRunner, tempFeed);

      if (deleteUploadFiles) {
        await uploadFileService.deleteUnconnectedLinks(
          queryRunner,
          deleteUploadFiles.uploadFileWithoutFeedId,
          deleteUploadFiles.deleteFileLinksArray
        );
      }
    }

    const result = await getTempFeed(queryRunner, newTempFeed.id);

    await queryRunner.commitTransaction();

    return result;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw new Error(`createTempFeed TRANSACTION error: ${err}`);
  } finally {
    await queryRunner.release();
  }
};

// 게시글 수정 -----------------------------------------------------------
const updateFeed = async (
  userId: number,
  feedInfo: TempFeedDto | FeedDto,
  feedId: number,
  fileLinks: string[]
): Promise<Feed> => {
  // 수정 전 기존 feed 정보
  const originFeed = await FeedRepository.getFeed(feedId);

  if (originFeed.user.id !== userId) {
    const error = new Error('ONLY_THE_AUTHOR_CAN_EDIT');
    error.status = 403;
    throw error;
  }

  if (originFeed.status === 2) {
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
      feed,
      originFeed,
      fileLinks
    );

    const newFeed = await queryRunner.manager
      .withRepository(FeedRepository)
      .updateFeed(feedId, feed);
    const result = await queryRunner.manager
      .withRepository(FeedRepository)
      .getFeed(newFeed.id);

    await queryRunner.commitTransaction();

    return result;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw new Error(`updateTempFeed TRANSACTION error: ${err}`);
  } finally {
    await queryRunner.release();
  }
};

// 게시글 리스트 --------------------------------------------------------------
const getFeedList = async (
  categoryId: number,
  page: number
): Promise<FeedList[]> => {
  if (!categoryId || categoryId === 0) {
    categoryId = undefined;
  }

  const limit: number = 5;
  if (!page) {
    page = 1;
  }
  const startIndex: number = (page - 1) * limit;
  return await FeedListRepository.getFeedList(categoryId, startIndex, limit);
};

// TODO deleteFeed

const getEstimations = async (): Promise<Estimation[]> => {
  return await dataSource.getRepository(Estimation).find();
};

export default {
  createFeed,
  updateFeed,
  getFeedList,
  getTempFeedList,
  getEstimations,
};
