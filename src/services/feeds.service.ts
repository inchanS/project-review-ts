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
import { IsNull, Like } from 'typeorm';
import uploadService from './upload.service';
import { Estimation } from '../entities/estimation.entity';

// 임시저장 ==================================================================
// 임시저장 게시글 리스트 --------------------------------------------------------
const getTempFeedList = async (userId: number) => {
  return await FeedListRepository.getTempFeedList(userId);
};

// 임시저장 게시글 저장 -----------------------------------------------------------
// TODO createTempFeed와 updateTempFeed의 중복을 줄일 수 있을까?
const createTempFeed = async (
  feedInfo: TempFeedDto,
  file_links: string[]
): Promise<Feed> => {
  feedInfo = plainToInstance(TempFeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });
  // FeedStatus id 2 is 'temporary'
  feedInfo.status = 2;

  // transaction으로 묶어주기
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // feed 저장
    const newTempFeed: Feed = plainToInstance(FeedDto, feedInfo);
    const tempFeed = await queryRunner.manager
      .withRepository(FeedRepository)
      .createFeed(newTempFeed);

    // uploadFile에 feed의 ID를 연결해주는 함수
    if (file_links) {
      for (const file_link of file_links) {
        // uploadFile테이블에서 file_link를 조건으로 id를 찾는다.
        const findUploadfile = await queryRunner.manager.findOne(UploadFiles, {
          loadRelationIds: true,
          where: { file_link: file_link },
        });

        // 만약 이미 다른 feed와 연결되어있는 file_link라면 에러를 던진다.
        if (findUploadfile.feed !== null) {
          // FIXME "'throw' of exception caught locally" 해결하기
          throw new Error(`file_link already exists`);
        }

        // uploadFile테이블에서 찾은 id의 Entity에 feed테이블의 id를 연결하여 update한다.
        await queryRunner.manager.update(UploadFiles, findUploadfile.id, {
          feed: tempFeed,
        });
      }

      // 해당 사용자의 uploadfile중 feedID가 없는 entity 찾기
      const uploadFileWithoutFeed = await queryRunner.manager.find(
        UploadFiles,
        {
          loadRelationIds: true,
          where: {
            file_link: Like(
              `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${feedInfo.user}%`
            ),
            feed: IsNull(),
          },
        }
      );

      // 해당 사용자의 uploadfile중 feedID가 없는 entity 삭제하기
      if (uploadFileWithoutFeed.length > 0) {
        const uploadFileWithoutFeedId = uploadFileWithoutFeed.map(
          uploadFile => {
            return uploadFile.id;
          }
        );
        await queryRunner.manager.delete(UploadFiles, uploadFileWithoutFeedId);

        // AWS S3에서도 파일 삭제하기
        let deleteFileLinksArray = [];
        for (const uploadFile of uploadFileWithoutFeed) {
          deleteFileLinksArray.push(uploadFile.file_link);
        }
        await uploadService.deleteUploadFile(deleteFileLinksArray);
      }
    }
    const result = await queryRunner.manager
      .withRepository(FeedRepository)
      .getFeed(tempFeed.id);

    await queryRunner.commitTransaction();

    return result;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw new Error(`createTempFeed TRANSACTION error: ${err}`);
  } finally {
    await queryRunner.release();
  }
};

// 게시글 임시저장 수정 -----------------------------------------------------------
const updateTempFeed = async (
  feedId: number,
  feedInfo: TempFeedDto,
  file_links: string
): Promise<Feed> => {
  // 수정 전 기존 feed 정보
  const originFeed = await FeedRepository.getFeed(feedId);

  // TODO 유저 확인 유효성검사 추가하기
  feedInfo = plainToInstance(TempFeedDto, feedInfo);
  await validateOrReject(feedInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  // transaction으로 묶어주기
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 수정된 feed 저장
    let newTempFeed: Feed = plainToInstance(FeedDto, feedInfo);
    const tempFeed = await queryRunner.manager
      .withRepository(FeedRepository)
      .createOrUpdateFeed(feedId, newTempFeed);

    // 새로운 업로드 파일이 변경되었는지 확인
    for (const file_link of file_links) {
      const checkFileLink = await originFeed.uploadFiles.find(
        (uploadFile: UploadFiles) => uploadFile.file_link === file_link
      );

      // FIXME 업로드 파일의 내용이 변경됐을 경우,
      //  파일 링크는 배열이고, 그중, 하나는 수정된 파일링크인데 다른 하나만 수정됐을때!! 어떻게 처리할지 고민해보기
      //  1. update 할때, 기존 파일링크와 새 파일링크를 함께 업데이트 한다.
      //  2. 그리고 나서 feed와 연결되지 않은 사용자의 파일링크를 찾아 지운다.

      // 업로드 파일의 내용이 변경됐을 경우
      if (!checkFileLink) {
        // 파일링크가 하나도 없다면, feedId가 비어있는채 업로드된 파일의 entity와 S3에서의 파일을 삭제
        let uploadFilesIdArray = [];
        let deleteFileLinksArray = [];
        for (const uploadFile of originFeed.uploadFiles) {
          uploadFilesIdArray.push(uploadFile.id);
          deleteFileLinksArray.push(uploadFile.file_link);
        }
        if (uploadFilesIdArray.length > 0) {
          await queryRunner.manager.delete(UploadFiles, uploadFilesIdArray);
          await uploadService.deleteUploadFile(deleteFileLinksArray);
        }
      }

      const findUploadFile = await queryRunner.manager.findOne(UploadFiles, {
        where: { file_link: file_link },
      });
      // uploadFile에 feed의 ID를 연결해주는 함수
      await queryRunner.manager.update(UploadFiles, findUploadFile, {
        feed: tempFeed,
      });
    }

    const result = await queryRunner.manager
      .withRepository(FeedRepository)
      .getFeed(tempFeed.id);

    await queryRunner.commitTransaction();

    return result;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw new Error(`updateTempFeed TRANSACTION error: ${err}`);
  } finally {
    await queryRunner.release();
  }
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

const getEstimations = async (): Promise<Estimation[]> => {
  return await dataSource.getRepository(Estimation).find();
};

export default {
  createFeed,
  getFeedList,
  createTempFeed,
  getTempFeedList,
  updateTempFeed,
  getEstimations,
};
