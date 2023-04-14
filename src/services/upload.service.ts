import sharp from 'sharp';
import { DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../middleware/uploadToS3';
import dataSource from '../repositories/data-source';
import { UploadFiles } from '../entities/uploadFiles.entity';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { invokeLambda } from '../utils/awsLambda';

const uploadFiles = async (
  userId: number,
  files: Express.Multer.File[]
): Promise<object> => {
  // 사용자 유효성 검사
  await UserRepository.findOneOrFail({
    where: { id: userId },
  }).catch(() => {
    throw { status: 400, message: 'INVALID_USER' };
  });

  // aws S3는 동일한 이름의 파일을 업로드하면 덮어쓰기를 한다. 이에 대한 대비책으로 파일 이름을 랜덤하게 생성한다.
  let files_link: string[] = [];

  for (const file of files) {
    const randomFileName = (bytes: number = 16) =>
      crypto.randomBytes(bytes).toString('hex');

    const fileName = Date.now().toString().concat(randomFileName());
    const fileExtension = file.originalname.split('.').pop();

    // 이미지 파일인지 확인
    const imageFilter = file.originalname.match(/\.(jpg|jpeg|png|gif)$/);

    let fileBuffer;
    let isImage;
    if (!imageFilter) {
      fileBuffer = file.buffer;
      isImage = false;
    } else {
      // 이미지 사이즈를 resizing 하는 함수(설정수치보다 작을 경우, 원본 이미지 그대로 사용)
      isImage = true;
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      // 이미지가 resize할 크기보다 작을 때, 원본 이미지 그대로 사용
      if (metadata.width < 1920) {
        fileBuffer = file.buffer;
      } else {
        // 이미지가 resize할 크기보다 클 때, resize 실행
        fileBuffer = await image
          .resize({ width: 1920, fit: 'inside' })
          .toBuffer();
      }
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

    const command = new PutObjectCommand(params);

    try {
      await s3.send(command);
    } catch (err) {
      if (err) {
        throw new Error(`UPLOAD_FILE_FAIL: ${err}`);
      }
    }

    let fileSize: string;
    if (file.size < 1024 * 1024) {
      // 파일 크기가 1MB 미만인 경우 KB 단위로 출력
      const fileSizeInKB = file.size / 1024;
      fileSize = `${fileSizeInKB.toFixed(2)}KB`;
    } else {
      // 파일 크기가 1MB 이상인 경우 MB 단위로 출력
      const fileSizeInMB = file.size / (1024 * 1024);
      fileSize = `${fileSizeInMB.toFixed(2)}MB`;
    }

    const newUploadFile = await dataSource.manager.create<UploadFiles>(
      'UploadFiles',
      {
        file_link: file_link,
        is_img: isImage,
        file_name: file.originalname,
        file_size: fileSize,
      }
    );
    await dataSource.manager.save(newUploadFile);
  }
  return files_link;
};
// uploadFiles 업로드된 파일을 삭제하는 함수 ---------------------------------------------------

// mySQL에서 file_link를 통해 uploadFile의 ID를 찾는 함수
const findFile = async (file_link: string) => {
  try {
    return await dataSource.manager.findOneOrFail<UploadFiles>(UploadFiles, {
      where: { file_link: file_link },
    });
  } catch (err) {
    throw { status: 404, message: 'NOT_FOUND_UPLOAD_FILE' };
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

export type Params = { Bucket: string; Key: string };
const deleteUploadFile = async (
  userId: number,
  file_links: string[]
): Promise<void> => {
  await UserRepository.findOneOrFail({
    where: { id: userId },
  }).catch(() => {
    throw { status: 400, message: 'INVALID_USER' };
  });

  // AWS S3 Key값을 담을 배열
  let keyArray: { Key: string }[] = [];

  // mySQL에서 file_link를 통해 uploadFile의 ID를 담을 배열
  let uploadFileIdArray: number[] = [];

  // feeds.service에서 본 함수를 사용할때, mySQL의 테이블에서 삭제하는 로직은 필요가 없기때문에 구분 조건을 만들어준다.
  const newFileLinks = file_links.filter(
    (file_link: string) => file_link !== 'DELETE_FROM_UPLOAD_FILES_TABLE'
  );

  const deleteFiles = async (newFileLinks: string[], userId: number) => {
    const findAndCheckPromises = newFileLinks.map(async file_link => {
      const findFileResult = await findFile(file_link);
      const file_userId = Number(findFileResult.file_link.split('/')[3]);

      if (file_userId !== userId) {
        throw { status: 403, message: 'DELETE_UPLOADED_FILE_IS_NOT_YOURS' };
      }

      const param: Params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: findFileResult.file_link.split('.com/')[1],
      };

      keyArray.push({ Key: param.Key });
      uploadFileIdArray.push(findFileResult.id);

      // FIXME 여기가 지울 파일이 많아지면 병목현상?인지 여튼 오래걸리면서 transaction이 잠기는 현상이 발생한다.
      // await checkFileAccess(param);
      await invokeLambda(param);
    });
    await Promise.all(findAndCheckPromises);
  };

  // 이 함수를 호출하여 파일을 삭제
  await deleteFiles(newFileLinks, userId);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Delete: {
      Objects: keyArray,
    },
  };

  // AWS S3에서 개체 삭제
  try {
    await s3.send(new DeleteObjectsCommand(params));
  } catch (err: any) {
    if (err) {
      throw new Error(`AWS_SEND_COMMAND_FILE_FAIL: ${err}`);
    }
  }

  // file_links에 'DELETE_FROM_UPLOAD_FILES_TABLE'가 포함되어있으면 mySQL 테이블에서도 개체 삭제
  if (file_links.includes('DELETE_FROM_UPLOAD_FILES_TABLE')) {
    // mySQL에서 개체 삭제
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await dataSource.manager.softDelete(UploadFiles, uploadFileIdArray);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(`DELETE_UPLOAD_FILE_FAIL: ${err}`);
    }
  }
};

export default { uploadFiles, deleteUploadFile };
