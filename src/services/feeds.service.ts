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
import { FeedUploadFiles } from '../entities/feedUploadFiles.entity';

// TODO 파일이 여러개일 경우 처리
// uploadFile의 ID와 feed의 ID를 연결해주는 함수
const connectFeedAndUploadFile = async (feed: Feed, file_link: string) => {
  const findUploadfile = await dataSource.manager.findOne(UploadFiles, {
    where: { file_link: file_link },
  });

  const newFeedUploadFiles: FeedUploadFiles = {
    feed: feed,
    uploadFiles: findUploadfile,
  };

  const feedUploadFiles = await dataSource.manager.create(
    FeedUploadFiles,
    newFeedUploadFiles
  );
  await dataSource.manager.save(FeedUploadFiles, feedUploadFiles);
};

// 임시저장 게시글 저장 --------------------------------
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
    await connectFeedAndUploadFile(tempFeed, file_link);
  }

  return await FeedRepository.getFeed(tempFeed.id);
};

const updateTempFeed = async (
  feedId: number,
  feedInfo: TempFeedDto,
  file_link: string
): Promise<Feed> => {
  const [originFeed] = await FeedRepository.getFeed(feedId);

  // TODO 유저 확인 유효성검사 추가하기
  feedInfo = plainToInstance(TempFeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });
  // feed 저장
  let newTempFeed: Feed = plainToInstance(FeedDto, feedInfo);
  const tempFeed = await FeedRepository.createOrUpdateFeed(feedId, newTempFeed);

  // 새로운 업로드 파일이 있을 경우
  const checkFileLink = await originFeed.feedUploadFiles.find(
    (feedUploadFile: FeedUploadFiles) =>
      feedUploadFile.uploadFiles.file_link === file_link
  );
  if (!checkFileLink) {
    await connectFeedAndUploadFile(tempFeed, file_link);
  }

  return await FeedRepository.getFeed(tempFeed.id);
};

// 게시글 저장 --------------------------------
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
    await connectFeedAndUploadFile(newFeed, file_link);
  }

  return await FeedRepository.getFeed(newFeed.id);
};
const getTempFeed = async (userId: number) => {
  return await FeedListRepository.getTempFeedList(userId);
};
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

// TODO updateFeed

// TODO deleteFeed

export default {
  createFeed,
  getFeedList,
  createTempFeed,
  getTempFeedList: getTempFeed,
  updateTempFeed,
};
