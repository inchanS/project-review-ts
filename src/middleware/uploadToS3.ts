import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';

const storage: multer.StorageEngine = multer.memoryStorage();

// 파일의 크기는 5MB로 제한합니다.
const upload: multer.Multer = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// AWS S3 객체를 생성합니다.
const s3: S3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
  region: process.env.AWS_REGION as string,
});

export { upload, s3 };
