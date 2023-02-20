import { Router } from 'express';
import { asyncWrap } from '../utils/util';
const router = Router();

import uploadToS3 from '../middleware/uploadToS3';
import { authValidateOrReject } from '../middleware/jwt.strategy';

router.post(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(uploadToS3.upload.single('file')),
  asyncWrap(uploadToS3.uploadFiles)
);

router.delete('', asyncWrap(uploadToS3.deleteUploadFile));

export default router;
