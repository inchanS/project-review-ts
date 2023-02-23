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
import { UploadFiles } from '../entities/uploadFiles.entity';
import dataSource from '../repositories/index.db';

// 임시저장 ==================================================================
// 임시저장 게시글 리스트 --------------------------------------------------------
const getTempFeedList = async (userId: number) => {
  return await FeedListRepository.getTempFeedList(userId);
};

// 임시저장 게시글 저장 -----------------------------------------------------------
// TODO createTempFeed와 updateTempFeed의 중복을 줄일 수 있을까?
const createTempFeed = async (
  feedInfo: TempFeedDto,
  file_link: string
): Promise<Feed> => {
  feedInfo = plainToInstance(TempFeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });
  // FeedStatus id 2 is 'temporary'
  feedInfo.status = 2;

  // feed 저장
  let newTempFeed: Feed = plainToInstance(FeedDto, feedInfo);
  const tempFeed = await FeedRepository.createFeed(newTempFeed);

  if (file_link) {
    // TODO 파일이 여러개일 경우 처리
    // uploadFile에 feed의 ID를 연결해주는 함수
    const findUploadfile = await dataSource.manager.findOne(UploadFiles, {
      where: { file_link: file_link },
    });

    await dataSource.manager.update(UploadFiles, findUploadfile.id, {
      feed: tempFeed,
    });
  }

  return await FeedRepository.getFeed(tempFeed.id);
};

// 게시글 임시저장 수정 -----------------------------------------------------------
const updateTempFeed = async (
  feedId: number,
  feedInfo: TempFeedDto,
  file_link: string
): Promise<Feed> => {
  // 수정 전 기존 feed 정보
  const originFeed = await FeedRepository.getFeed(feedId);

  // TODO 유저 확인 유효성검사 추가하기
  feedInfo = plainToInstance(TempFeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });
  // 수정된 feed 저장
  let newTempFeed: Feed = plainToInstance(FeedDto, feedInfo);
  const tempFeed = await FeedRepository.createOrUpdateFeed(feedId, newTempFeed);

  // 새로운 업로드 파일이 있을 경우, 파일 찾기
  const checkFileLink = await originFeed.uploadFiles.find(
    (uploadFile: UploadFiles) => uploadFile.file_link === file_link
  );

  const findUploadfile = await dataSource.manager.findOne(UploadFiles, {
    where: { file_link: file_link },
  });
  // 업로드 파일이의 내용이 변경됐을 경우
  if (!checkFileLink) {
    // 파일링크가 하나도 없다면, feedId가 비어있는채 업로드된 파일의 entity와 S3에서의 파일을 삭제

    for (const uploadFile of originFeed.uploadFiles) {
      await dataSource.manager.delete(UploadFiles, uploadFile.id);
    }
  }

  // uploadFile에 feed의 ID를 연결해주는 함수

  await dataSource.manager.update(UploadFiles, findUploadfile, {
    feed: tempFeed,
  });

  return await FeedRepository.getFeed(tempFeed.id);
};

// 게시글 ===================================================================
// 게시글 리스트 --------------------------------------------------------------
const getFeedList = async (
  categoryId: number,
  page: number
): Promise<FeedList[]> => {
  if (!categoryId) {
    categoryId = undefined;
  }
  const limit: number = 5;
  if (!page) {
    page = 1;
  }
  const startIndex: number = (page - 1) * limit;
  return await FeedListRepository.getFeedList(categoryId, startIndex, limit);
};

// 게시글 저장 ----------------------------------------------------------------
const createFeed = async (
  feedInfo: FeedDto,
  file_link: string
): Promise<Feed> => {
  feedInfo = plainToInstance(FeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  const feed: Feed = feedInfo;
  feed.posted_at = new Date();

  const newFeed = await FeedRepository.createFeed(feed);

  if (file_link) {
    // TODO feedId 연결하는 함수 넣기
  }

  return await FeedRepository.getFeed(newFeed.id);
};

// TODO updateFeed

// TODO deleteFeed

export default {
  createFeed,
  getFeedList,
  createTempFeed,
  getTempFeedList,
  updateTempFeed,
};
