import sharp from 'sharp';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { s3 } from '../middleware/uploadToS3';
import dataSource from '../repositories/index.db';
import { UploadFiles } from '../entities/uploadFiles.entity';
import crypto from 'crypto';

const uploadFiles = async (
  userId: number,
  files: Express.Multer.File[]
): Promise<object> => {
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
          .resize({ width: 1080, fit: 'inside' })
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

    const newUploadFile = await dataSource.manager.create<UploadFiles>(
      'UploadFiles',
      {
        file_link: file_link,
        is_img: isImage,
      }
    );
    await dataSource.manager.save(newUploadFile);
  }
  return files_link;
};

const deleteUploadFile = async (file_links: string[]): Promise<void> => {
  // AWS S3 Key값을 담을 배열
  let keyArray = [];

  // mySQL에서 file_link를 통해 uploadFile의 ID를 담을 배열
  let uploadFileIdArray = [];

  // feeds.service에서 본 함수를 사용할때, mySQL의 테이블에서는 삭제할 필요가 없기때문에 조건을 만들어준다.
  const newFileLinks = file_links.filter(
    (file_link: string) => file_link !== 'deleteUploadFile.constroller'
  );

  for (const file_link of newFileLinks) {
    const findFile = await dataSource.manager.findOneOrFail<UploadFiles>(
      UploadFiles,
      {
        where: { file_link: file_link },
      }
    );

    const param = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: findFile.file_link.split('.com/')[1],
    };

    keyArray.push({ Key: param.Key });
    uploadFileIdArray.push(findFile.id);
    // 개체 확인
    try {
      await s3.send(new GetObjectCommand(param));
    } catch (err: any) {
      if (err.Code === 'AccessDenied' || err.$metadata.httpStatusCode === 404) {
        throw new Error(`DELETE_UPLOADED_FILE_IS_NOT_EXISTS: ${err}`);
      }
    }
  }

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

  if (file_links.includes('deleteUploadFile.constroller')) {
    // mySQL에서 개체 삭제
    await dataSource.manager.delete(UploadFiles, uploadFileIdArray);
  }
};

export default { uploadFiles, deleteUploadFile };
