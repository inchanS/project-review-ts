import { IsNull, Like, QueryRunner } from 'typeorm';
import { UploadFiles } from '../entities/uploadFiles.entity';
import uploadService from './upload.service';
import { Feed } from '../entities/feed.entity';

const createDeleteFileLinksList = async (
  originFeed: Feed,
  fileLinks: string[]
) => {
  let uploadFileIdsToDelete: number[] = [];
  let fileLinksToDelete: string[] = [];

  // fileLinks가 없다면 기존 업로드 파일을 모두 삭제할 수 있도록 담아둔다.
  if (!fileLinks) {
    for (const uploadFile of originFeed.uploadFiles) {
      uploadFileIdsToDelete.push(uploadFile.id);
      fileLinksToDelete.push(uploadFile.file_link);
    }
  } else {
    // 게시물에 등록된 기존 파일링크 중 새로운 파일링크 배열과 비교하여 없는 링크는 삭제할 수 있도록 찾아서 담아둔다.
    for (const originFileLink of originFeed.uploadFiles) {
      const isFileLinkfound = fileLinks.some(
        fileLink => fileLink === originFileLink.file_link
      );

      if (!isFileLinkfound) {
        uploadFileIdsToDelete.push(originFileLink.id);
        fileLinksToDelete.push(originFileLink.file_link);
      }
    }
  }

  return { uploadFileIdsToDelete, fileLinksToDelete };
};

// 새로운 파일링크 중 기존 게시물에 등록된 파일링크와 다른 것이 있다면 UploadFiles 테이블에 feedId를 추가하여 연결해준다.
const updateFileLinks = async (
  queryRunner: QueryRunner,
  feed: Feed,
  fileLinks: string[]
): Promise<void> => {
  for (const fileLink of fileLinks) {
    const findUploadFile = await queryRunner.manager.findOne(UploadFiles, {
      loadRelationIds: true,
      where: { file_link: fileLink },
    });

    if (findUploadFile.feed !== null) {
      if (Number(findUploadFile.feed) === feed.id) {
        continue;
      }
      throw new Error(`file_link already exists`);
    }

    await queryRunner.manager.update(UploadFiles, findUploadFile.id, {
      feed: feed,
    });
  }
};

export type DeleteUploadFiles = {
  uploadFileWithoutFeedId: number[];
  deleteFileLinksArray: string[];
};
const deleteUnusedUploadFiles = async (
  queryRunner: QueryRunner,
  feedInfo: Feed
): Promise<DeleteUploadFiles> => {
  const uploadFileWithoutFeed = await queryRunner.manager.find(UploadFiles, {
    loadRelationIds: true,
    where: {
      file_link: Like(
        `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${feedInfo.user}%`
      ),
      feed: IsNull(),
    },
  });

  if (uploadFileWithoutFeed.length > 0) {
    const uploadFileWithoutFeedId = uploadFileWithoutFeed.map(
      uploadFile => uploadFile.id
    );

    let deleteFileLinksArray = [];
    for (const uploadFile of uploadFileWithoutFeed) {
      deleteFileLinksArray.push(uploadFile.file_link);
    }

    return { uploadFileWithoutFeedId, deleteFileLinksArray };
  }
};

const deleteUnconnectedLinks = async (
  queryRunner: QueryRunner,
  uploadFileIdsToDelete: number[],
  fileLinksToDelete: string[]
) => {
  if (uploadFileIdsToDelete.length > 0) {
    await queryRunner.manager.delete(UploadFiles, uploadFileIdsToDelete);
    await uploadService.deleteUploadFile(fileLinksToDelete);
  }
};
const checkUploadFileOfFeed = async (
  queryRunner: QueryRunner,
  feedId: number,
  feed: Feed,
  originFeed: Feed,
  fileLinks: string[]
) => {
  let { uploadFileIdsToDelete, fileLinksToDelete } =
    await createDeleteFileLinksList(originFeed, fileLinks);

  if (fileLinks) {
    await updateFileLinks(queryRunner, originFeed, fileLinks);
  }

  const findUnusedUploadFiles = await deleteUnusedUploadFiles(
    queryRunner,
    feed
  );

  if (findUnusedUploadFiles) {
    const { uploadFileWithoutFeedId, deleteFileLinksArray } =
      findUnusedUploadFiles;

    uploadFileIdsToDelete.push(...uploadFileWithoutFeedId);
    fileLinksToDelete.push(...deleteFileLinksArray);
  }

  await deleteUnconnectedLinks(
    queryRunner,
    uploadFileIdsToDelete,
    fileLinksToDelete
  );
};

export default {
  updateFileLinks,
  checkUploadFileOfFeed,
  deleteUnusedUploadFiles,
  deleteUnconnectedLinks,
};
