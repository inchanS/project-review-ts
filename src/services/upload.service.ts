import sharp from 'sharp';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { s3 } from '../middleware/uploadToS3';
import dataSource from '../repositories/index.db';
import { UploadFiles } from '../entities/uploadFiles.entity';
import crypto from 'crypto';

const uploadFiles = async (userId: number, file: Express.Multer.File) => {
  // aws S3는 동일한 이름의 파일을 업로드하면 덮어쓰기를 한다. 이에 대한 대비책으로 파일 이름을 랜덤하게 생성한다.
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

  const file_link = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileNameWithExtensionInUserFolder}`;

  const newUploadFile = await dataSource.manager.create<UploadFiles>(
    'UploadFiles',
    {
      file_link: file_link,
      is_img: isImage,
    }
  );
  await dataSource.manager.save(newUploadFile);

  return file_link;
};

const deleteUploadFile = async (file_link: string) => {
  const findFile = await dataSource.manager.findOne<UploadFiles>(UploadFiles, {
    where: { file_link: file_link },
  });

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: findFile.file_link.split('.com/')[1],
  };

  // 개체 확인
  try {
    await s3.send(new GetObjectCommand(params));
  } catch (err: any) {
    if (err.Code === 'AccessDenied' || err.$metadata.httpStatusCode === 404) {
      throw new Error(`DELETE_UPLOADED_FILE_IS_NOT_EXISTS: ${err}`);
    }
  }

  // 개체 삭제
  try {
    await s3.send(new DeleteObjectCommand(params));
  } catch (err: any) {
    if (err) {
      throw new Error(`AWS_SEND_COMMAND_FILE_FAIL: ${err}`);
    }
  }

  // TODO 개체 삭제 후 관련된 DB 데이터 삭제
};

export default { uploadFiles, deleteUploadFile };
