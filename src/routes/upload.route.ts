import { Router } from 'express';
import { asyncWrap } from '../utils/util';
const router = Router();

import { authValidateOrReject } from '../middleware/jwt.strategy';
import { upload } from '../middleware/uploadToS3';
import uploadController from '../controllers/upload.controller';

router.post(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(upload.array('file', 5)), // 한번에 업로드 가능한 파일 개수는 5개로 제한
  asyncWrap(uploadController.uploadFiles)
);

router.delete('', asyncWrap(uploadController.deleteUploadFile));

export default router;
