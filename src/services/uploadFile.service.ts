import { Brackets, EntityNotFoundError, QueryRunner } from 'typeorm';
import { UploadFiles } from '../entities/uploadFiles.entity';
import { Feed } from '../entities/feed.entity';
import { UploadService } from './upload.service';
import { CustomError } from '../utils/util';

export class UploadFileService {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  private generateListOfLinksForDeletableFiles: (
    originFeed: Feed,
    fileLinks: string[]
  ) => Promise<deletableFilesBasket> = async (
    originFeed: Feed,
    fileLinks: string[]
  ) => {
    let { uploadFileIdsToDelete, fileLinksToDelete }: deletableFilesBasket = {
      uploadFileIdsToDelete: [],
      fileLinksToDelete: [],
    };

    // fileLinks가 없다면 기존 업로드 파일을 모두 삭제할 수 있도록 담아둔다.
    if (originFeed.uploadFiles) {
      if (!fileLinks) {
        for (const uploadFile of originFeed.uploadFiles) {
          uploadFileIdsToDelete.push(uploadFile.id);
          fileLinksToDelete.push(uploadFile.file_link);
        }
      } else {
        // 게시물에 등록된 기존 파일링크 중 새로운 파일링크 배열과 비교하여 없는 링크는 삭제할 수 있도록 찾아서 담아둔다.
        for (const originFileLink of originFeed.uploadFiles) {
          const isFileLinkfound: boolean = fileLinks.some(
            fileLink => fileLink === originFileLink.file_link
          );

          if (!isFileLinkfound) {
            uploadFileIdsToDelete.push(originFileLink.id);
            fileLinksToDelete.push(originFileLink.file_link);
          }
        }
      }
    }

    return { uploadFileIdsToDelete, fileLinksToDelete };
  };

  // 새로운 파일링크 중 기존 게시물에 등록된 파일링크와 다른 것이 있다면 UploadFiles 테이블에 feedId를 추가하여 연결해준다.
  public updateFileLinks = async (
    queryRunner: QueryRunner,
    feed: Feed,
    fileLinks: string[]
  ): Promise<void> => {
    for (const fileLink of fileLinks) {
      try {
        const findUploadFile: UploadFiles =
          await queryRunner.manager.findOneOrFail(UploadFiles, {
            loadRelationIds: true,
            where: { file_link: fileLink },
          });

        if (findUploadFile.feed !== null) {
          if (Number(findUploadFile.feed) === feed.id) {
            continue;
          } else {
            throw new CustomError(409, `FILE_LINK_ALREADY_EXISTS`);
          }
        }

        await queryRunner.manager.update(UploadFiles, findUploadFile.id, {
          feed: feed,
        });
      } catch (error) {
        if (error instanceof EntityNotFoundError) {
          throw new CustomError(404, `NOT_FOUND_UPLOAD_FILE_LINK`);
        }
        throw error;
      }
    }
  };

  public deleteUnusedUploadFiles = async (
    queryRunner: QueryRunner,
    userId: number
  ): Promise<DeleteUploadFiles | undefined> => {
    const uploadFileWithoutFeed: UploadFiles[] = await queryRunner.manager
      .getRepository(UploadFiles)
      .createQueryBuilder('uploadFiles')
      .leftJoinAndSelect('uploadFiles.feed', 'feed')
      .where('uploadFiles.file_link LIKE :fileLink', {
        fileLink: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${userId}%`,
      })
      // .andWhere('feed.id IS NULL')
      // .orWhere('feed.deleted_at IS NOT NULL')
      // 아래 콜백함수 메소드가 아닌 위의 방법처럼 체이닝하여 조건을 사용할 수도 있다.
      .andWhere(
        new Brackets(qb => {
          qb.where('feed.id IS NULL').orWhere('feed.deleted_at IS NOT NULL');
        })
      )
      .getMany();

    if (uploadFileWithoutFeed.length > 0) {
      const uploadFileWithoutFeedId: number[] = uploadFileWithoutFeed.map(
        (uploadFile: UploadFiles) => uploadFile.id
      );

      let deleteFileLinksArray: string[] = [];
      for (const uploadFile of uploadFileWithoutFeed) {
        deleteFileLinksArray.push(uploadFile.file_link);
      }

      return { uploadFileWithoutFeedId, deleteFileLinksArray };
    } else {
      return undefined;
    }
  };

  public deleteUnconnectedLinks = async (
    queryRunner: QueryRunner,
    uploadFileIdsToDelete: number[],
    fileLinksToDelete: string[],
    userId: number
  ): Promise<void> => {
    if (uploadFileIdsToDelete.length > 0) {
      await queryRunner.manager.softDelete(UploadFiles, uploadFileIdsToDelete);
      await this.uploadService.deleteUploadFile(userId, fileLinksToDelete);
    }
  };
  public checkUploadFileOfFeed = async (
    queryRunner: QueryRunner,
    userId: number,
    originFeed: Feed,
    fileLinks: string[]
  ): Promise<void> => {
    let { uploadFileIdsToDelete, fileLinksToDelete }: deletableFilesBasket =
      await this.generateListOfLinksForDeletableFiles(originFeed, fileLinks);

    if (fileLinks) {
      await this.updateFileLinks(queryRunner, originFeed, fileLinks);
    }

    const findUnusedUploadFiles: DeleteUploadFiles | undefined =
      await this.deleteUnusedUploadFiles(queryRunner, userId);

    if (findUnusedUploadFiles) {
      const {
        uploadFileWithoutFeedId,
        deleteFileLinksArray,
      }: DeleteUploadFiles = findUnusedUploadFiles;

      uploadFileIdsToDelete.push(...uploadFileWithoutFeedId);
      fileLinksToDelete.push(...deleteFileLinksArray);
    }

    await this.deleteUnconnectedLinks(
      queryRunner,
      uploadFileIdsToDelete,
      fileLinksToDelete,
      userId
    );
  };
}
