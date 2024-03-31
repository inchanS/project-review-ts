import sharp from 'sharp';
import { DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../middleware/uploadToS3';
import { UploadFiles } from '../entities/uploadFiles.entity';
import crypto from 'crypto';
import { QueryRunner, Repository } from 'typeorm';
import { CustomError } from '../utils/util';
import { UploadFilesRepository } from '../repositories/uploadFiles.repository';

export class UploadService {
  private uploadFilesRepository: Repository<UploadFiles>;

  constructor(uploadFilesRepository: UploadFilesRepository) {
    this.uploadFilesRepository = uploadFilesRepository;
  }

  // module 'sharp'은 모킹하기가 너무 까다롭고 문제가 생기며 코드가 지저분해진다.
  // 때문에 함수를 분리하고 간단하게 이 함수들을 테스트하고 모킹한다.

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
    const imageFilter: RegExpMatchArray | null = filename.match(
      /\.(jpg|jpeg|png|gif)$/
    );
    return Boolean(imageFilter);
  }

  private convertToStringFileSize(size: number): string {
    let fileSize: string;

    if (size < 1024 * 1024) {
      // 파일 크기가 1MB 미만인 경우 KB 단위로 출력
      const fileSizeInKB: number = size / 1024;
      fileSize = `${fileSizeInKB.toFixed(2)}KB`;
    } else {
      // 파일 크기가 1MB 이상인 경우 MB 단위로 출력
      const fileSizeInMB: number = size / (1024 * 1024);
      fileSize = `${fileSizeInMB.toFixed(2)}MB`;
    }

    return fileSize;
  }

  // AWS S3에서 개체 업로드 및 삭제 명령 전달 함수
  private async commandToS3(
    command: DeleteObjectsCommand | PutObjectCommand
  ): Promise<void> {
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
    // aws S3는 동일한 이름의 파일을 업로드하면 덮어쓰기를 한다. 이에 대한 대비책으로 파일 이름을 랜덤하게 생성한다.
    let files_link: string[] = [];

    for (const file of files) {
      const randomFileName = (bytes: number = 16) =>
        crypto.randomBytes(bytes).toString('hex');

      const fileName: string = Date.now().toString().concat(randomFileName());
      const fileExtension: string | undefined = file.originalname
        .split('.')
        .pop();

      // 이미지 파일인지 확인
      const imageFilter: boolean = this.isImageFileToBoolean(file.originalname);

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

      const params: {
        ContentType: string;
        Bucket: string;
        Body: Buffer;
        Key: string;
      } = {
        Bucket: process.env.AWS_S3_BUCKET as string,
        Key: fileNameWithExtensionInUserFolder,
        Body: fileBuffer,
        ContentType: file.mimetype,
      };

      const command: PutObjectCommand = new PutObjectCommand(params);

      await this.commandToS3(command);

      const fileSizeString: string = this.convertToStringFileSize(file.size);

      // 클라이언트에서 UTF-8로 인코딩된 파일 이름을 디코딩하여 저장한다. (한글 파일명을 위해)
      const decodedFilename: string = decodeURIComponent(file.originalname);

      const newUploadFile: UploadFiles = this.uploadFilesRepository.create({
        user: { id: userId },
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
  private findFileLink = async (file_link: string): Promise<UploadFiles> => {
    try {
      return await this.uploadFilesRepository.findOneOrFail({
        loadRelationIds: true,
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

    const findAndCheckPromises: Promise<void>[] = newFileLinks.map(
      async (file_link: string): Promise<void> => {
        // 지울 파일의 링크가 DB에 있는지 찾는다. 없으면 에러를 반환한다.
        const findFileResult: UploadFiles = await this.findFileLink(file_link);

        // 찾은 파일의 사용자를 확인한다.
        const filesUserId: number = Number(findFileResult.user);

        // 파일의 사용자와 요청한 사용자가 같은지 확인한다.
        if (filesUserId !== userId) {
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
      }
    );
    await Promise.all(findAndCheckPromises);

    return { keyArray, uploadFileIdArray };
  };

  // 파일 삭제 함수
  public deleteUploadFile = async (
    userId: number,
    fileLinks: string[],
    queryRunner?: QueryRunner
  ): Promise<void> => {
    // deleteFiles 함수를 호출하여 S3에서 해당 파일들을 삭제하고 DB에서도 삭제할 수 있도록 keyArray와 uploadFileIdArray를 반환받는다.
    const checkDeleteFiles = await this.checkDeleteFiles(fileLinks, userId);

    const params: { Delete: { Objects: { Key: string }[] }; Bucket: string } = {
      Bucket: process.env.AWS_S3_BUCKET as string,
      Delete: {
        Objects: checkDeleteFiles.keyArray,
      },
    };

    const command: DeleteObjectsCommand = new DeleteObjectsCommand(params);

    // AWS S3에서 개체 삭제
    await this.commandToS3(command);

    // DB uploadFiles table에서 해당 데이터 삭제
    if (queryRunner) {
      // 함수의 인자로 queryRunner가 있다면 해당 Transaction 내에서 mySQL의 uploadFiles테이블의 파일 삭제를 진행한다.
      // feed.service에서 본 함수 이용시 Transaction 내에서 함수 처리
      await queryRunner.manager.softDelete(
        UploadFiles,
        checkDeleteFiles.uploadFileIdArray
      );
    } else {
      // DELETE url/upload API 사용시(파일 링크 직접 삭제 API) Transaction이 필요하지 않으므로 repository에서 직접 삭제 진행
      await this.uploadFilesRepository.softDelete(
        checkDeleteFiles.uploadFileIdArray
      );
    }
  };
}
