import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';

const storage = multer.memoryStorage();

// 파일의 크기는 5MB로 제한합니다.
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// AWS S3 객체를 생성합니다.
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

export { upload, s3 };
