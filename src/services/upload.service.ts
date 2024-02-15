import sharp from 'sharp';
import { DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../middleware/uploadToS3';
import dataSource from '../repositories/data-source';
import { UploadFiles } from '../entities/uploadFiles.entity';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { Repository } from 'typeorm';
import { CustomError } from '../utils/util';

export type Params = { Bucket: string; Key: string };
export class UploadService {
  private userRepository: UserRepository;
  private uploadFilesRepository: Repository<UploadFiles>;

  constructor() {
    this.userRepository = UserRepository.getInstance();
    this.uploadFilesRepository = dataSource.getRepository(UploadFiles);
  }

  // module 'sharp'은 모킹하기가 너무 까다롭고 문제가 생기며 코드가 지저분해진다.
  // 때문에 함수를 분리하고 간단하게 이 함수들을 테스트하고 모킹한다.

  // 사용자 유효성 검사 (로그인 유저의 경우, 현재 시점에서의 유효성을 검사한다.)
  private async validatorUserId(userId: number) {
    return await this.userRepository
      .findOneOrFail({
        where: { id: userId },
      })
      .catch(() => {
        throw new CustomError(400, 'INVALID_USER');
      });
  }

  private async resizeImage(buffer: Buffer): Promise<Buffer> {
    const image: sharp.Sharp = sharp(buffer);
    const metadata: sharp.Metadata = await image.metadata();

    if (metadata.width && metadata.width < 1920) {
      return buffer;
    } else {
      return await image.resize({ width: 1920, fit: 'inside' }).toBuffer();
    }
  }

  private isImageFileToBoolean(filename: string): boolean {
    const imageFilter = filename.match(/\.(jpg|jpeg|png|gif)$/);
    return Boolean(imageFilter);
  }

  private convertToStringFileSize(size: number) {
    let fileSize: string;

    if (size < 1024 * 1024) {
      // 파일 크기가 1MB 미만인 경우 KB 단위로 출력
      const fileSizeInKB = size / 1024;
      fileSize = `${fileSizeInKB.toFixed(2)}KB`;
    } else {
      // 파일 크기가 1MB 이상인 경우 MB 단위로 출력
      const fileSizeInMB = size / (1024 * 1024);
      fileSize = `${fileSizeInMB.toFixed(2)}MB`;
    }

    return fileSize;
  }

  // AWS S3에서 개체 업로드 및 삭제 명령 전달 함수
  private async commandToS3(command: DeleteObjectsCommand | PutObjectCommand) {
    try {
      // 유니온 타입으로 인한 타입 가드 처리 (이게 되려 코드가 지저분해보이기도 한 느낌)
      if (command instanceof DeleteObjectsCommand) {
        await s3.send(command as DeleteObjectsCommand);
      } else if (command instanceof PutObjectCommand) {
        await s3.send(command as PutObjectCommand);
      } else {
        throw new Error(`Invalid command type`);
      }
    } catch (err) {
      if (err) {
        throw new Error(`AWS_SEND_COMMAND_FILE_FAIL: ${err}`);
      }
    }
  }

  // this를 바인딩하기 위해 arrow function으로 작성
  // 파일 업로드
  public uploadFiles = async (
    userId: number,
    files: Express.Multer.File[]
  ): Promise<string[]> => {
    // 사용자 유효성 검사
    await this.validatorUserId(userId);

    // aws S3는 동일한 이름의 파일을 업로드하면 덮어쓰기를 한다. 이에 대한 대비책으로 파일 이름을 랜덤하게 생성한다.
    let files_link: string[] = [];

    for (const file of files) {
      const randomFileName = (bytes: number = 16) =>
        crypto.randomBytes(bytes).toString('hex');

      const fileName = Date.now().toString().concat(randomFileName());
      const fileExtension = file.originalname.split('.').pop();

      // 이미지 파일인지 확인
      const imageFilter = this.isImageFileToBoolean(file.originalname);

      let fileBuffer;
      let isImage;
      if (!imageFilter) {
        fileBuffer = file.buffer;
        isImage = false;
      } else {
        // 이미지 사이즈를 resizing 하는 함수(설정수치보다 작을 경우, 원본 이미지 그대로 사용)
        isImage = true;
        fileBuffer = await this.resizeImage(file.buffer);
      }

      // aws S3에 업로드할 파일 이름을 생성합니다.(유형 파악을 위해 확장자 추가)
      // userID별로 폴더를 구분하여 file을 업로드하기 위해 aws params의 Key값 재정렬
      const fileNameWithExtensionInUserFolder = `${userId}/${fileName}.${fileExtension}`;
      const file_link = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileNameWithExtensionInUserFolder}`;

      files_link.push(file_link);

      // S3 업로드를 위한 파라미터를 생성합니다.

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileNameWithExtensionInUserFolder,
        Body: fileBuffer,
        ContentType: file.mimetype,
      };

      const command: PutObjectCommand = new PutObjectCommand(params);

      await this.commandToS3(command);

      const fileSizeString: string = this.convertToStringFileSize(file.size);

      // 클라이언트에서 UTF-8로 인코딩된 파일 이름을 디코딩하여 저장한다. (한글 파일명을 위해)
      const decodedFilename = decodeURIComponent(file.originalname);

      const newUploadFile = this.uploadFilesRepository.create({
        file_link: file_link,
        is_img: isImage,
        file_name: decodedFilename,
        file_size: fileSizeString,
      });
      await this.uploadFilesRepository.save(newUploadFile);
    }
    return files_link;
  };

  // uploadFiles 업로드된 파일을 삭제하는 함수 ---------------------------------------------------

  // mySQL에서 file_link를 통해 uploadFile의 ID를 찾는 함수
  private findFileLink = async (file_link: string) => {
    try {
      return await this.uploadFilesRepository.findOneOrFail({
        where: { file_link: file_link },
      });
    } catch (err) {
      throw new CustomError(404, 'NOT_FOUND_UPLOAD_FILE');
    }
  };

  // AWS S3에서 파일의 유무를 확인하는 함수
  // const checkFileAccess = async (param: any) => {
  //   try {
  //     await s3.send(new GetObjectCommand(param));
  //   } catch (err: any) {
  //     if (err.Code === 'AccessDenied' || err.$metadata.httpStatusCode === 404) {
  //       throw {
  //         status: 404,
  //         message: `DELETE_UPLOADED_FILE_IS_NOT_EXISTS: ${err}`,
  //       };
  //     }
  //   }
  // };

  private checkDeleteFiles = async (newFileLinks: string[], userId: number) => {
    let param: Params;

    // AWS S3 Key값을 담을 배열
    let keyArray: { Key: string }[] = [];

    // mySQL에서 file_link를 통해 uploadFile의 ID를 담을 배열
    let uploadFileIdArray: number[] = [];

    const findAndCheckPromises = newFileLinks.map(async file_link => {
      // 지울 파일의 링크가 DB에 있는지 찾는다. 없으면 에러를 반환한다.
      const findFileResult = await this.findFileLink(file_link);

      // 찾은 파일의 사용자를 확인한다.
      const file_userId = Number(findFileResult.file_link.split('/')[3]);

      // 파일의 사용자와 요청한 사용자가 같은지 확인한다.
      if (file_userId !== userId) {
        throw new CustomError(403, 'DELETE_UPLOADED_FILE_IS_NOT_YOURS');
      }

      // 파일이 AWS S3에 있는지 확인한다.
      // 230706 현재 방법은 2가지 서버에서 S3에 있는 파일들을 확인하는 방법(checkFileAccess)과 lambda를 통해 확인하는 방법(invokeLambda)이 있다.
      // S3 명령을 위한 param 생성
      param = {
        Bucket: process.env.AWS_S3_BUCKET as string,
        Key: findFileResult.file_link.split('.com/')[1],
      };

      keyArray.push({ Key: param.Key });
      uploadFileIdArray.push(findFileResult.id);

      // FIXME 여기가 지울 파일이 많아지면 병목현상?인지 여튼 오래걸리면서 transaction이 잠기는 현상이 발생한다.
      // await checkFileAccess(param);
      // FIXME lambda - AWS 계정 바꿔야 함
      // await invokeLambda(param);
    });
    await Promise.all(findAndCheckPromises);

    return { keyArray, uploadFileIdArray };
  };

  // 파일 삭제 함수
  public deleteUploadFile = async (
    userId: number,
    file_links: string[]
  ): Promise<void> => {
    // 사용자 유효성 검사
    await this.validatorUserId(userId);

    // feeds.service에서 본 함수를 사용할때, mySQL의 테이블에서 삭제하는 로직은 필요가 없기때문에 구분 조건을 만들어준다.
    const newFileLinks = file_links.filter(
      (file_link: string) => file_link !== 'DELETE_FROM_UPLOAD_FILES_TABLE'
    );

    // deleteFiles 함수를 호출하여 S3에서 해당 파일들을 삭제하고 DB에서도 삭제할 수 있도록 keyArray와 uploadFileIdArray를 반환받는다.
    const checkDeleteFiles = await this.checkDeleteFiles(newFileLinks, userId);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Delete: {
        Objects: checkDeleteFiles.keyArray,
      },
    };

    const command: DeleteObjectsCommand = new DeleteObjectsCommand(params);

    // AWS S3에서 개체 삭제
    await this.commandToS3(command);

    // file_links에 'DELETE_FROM_UPLOAD_FILES_TABLE'가 포함되어있으면 mySQL 테이블에서도 개체 삭제
    // TODO  230706 굳이 transaction 안해도 되는거 아닌가??
    if (file_links.includes('DELETE_FROM_UPLOAD_FILES_TABLE')) {
      // mySQL에서 개체 삭제
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await this.uploadFilesRepository.softDelete(
          checkDeleteFiles.uploadFileIdArray
        );
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw new Error(`DELETE_UPLOAD_FILE_FAIL: ${err}`);
      } finally {
        await queryRunner.release();
      }
    }
  };
}
