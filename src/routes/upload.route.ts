import { Router } from 'express';
import { asyncWrap } from '../utils/util';
const router = Router();

import uploadToS3 from '../utils/uploadToS3';

router.post(
  '',
  uploadToS3.upload.single('image'),
  asyncWrap(uploadToS3.uploadFiles)
);

router.delete('', asyncWrap(uploadToS3.deleteUploadFile));

export default router;
