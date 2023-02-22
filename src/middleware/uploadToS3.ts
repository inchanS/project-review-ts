import { Request, Response } from 'express';
import multer from 'multer';
import * as crypto from 'crypto';
import sharp from 'sharp';

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import dataSource from '../repositories/index.db';
import { UploadFiles } from '../entities/uploadFiles.entity';

// upload middleware function 생성
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// AWS S3 객체를 생성합니다.
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

// aws S3는 동일한 이름의 파일을 업로드하면 덮어쓰기를 한다. 이에 대한 대비책으로 파일 이름을 랜덤하게 생성한다.
const randomFileName = (bytes: number = 16) =>
  crypto.randomBytes(bytes).toString('hex');

// ---------------------- API 엔드포인트 ----------------------

// 파일 업로드를 처리하는 API 엔드포인트 ----------------------
const uploadFiles = async (req: Request, res: Response) => {
  const userId: number = req.userInfo.id;

  const fileName = Date.now().toString().concat(randomFileName());
  const fileExtension = req.file.originalname.split('.').pop();

  // 이미지 파일인지 확인
  const imageFilter = req.file.originalname.match(/\.(jpg|jpeg|png|gif)$/);

  let fileBuffer;
  let isImage;
  if (!imageFilter) {
    fileBuffer = req.file.buffer;
    isImage = false;
  } else {
    // 이미지 사이즈를 resizing 하는 함수(설정수치보다 작을 경우, 원본 이미지 그대로 사용)
    isImage = true;
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();
    // 이미지가 resize할 크기보다 작을 때, 원본 이미지 그대로 사용
    if (metadata.width < 1920) {
      fileBuffer = req.file.buffer;
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
    ContentType: req.file.mimetype,
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

  // TODO res에서 middleware로 보내며 아래 함수를 객체로 바꾸고 createFeed.controller.ts에서 사용
  await res.send({
    file_name: fileNameWithExtensionInUserFolder,
    file_link: file_link,
  });
};

// 파일 삭제를 처리하는 API 엔드포인트 ----------------------
const deleteUploadFile = async (req: Request, res: Response) => {
  const { file_link } = req.body;
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

  await res.status(200).json({ message: 'DELETE_UPLOADED_FILE_SUCCESS' });
};

export default { uploadFiles, upload, deleteUploadFile };
