import { Router } from 'express';
import { asyncWrap } from '../utils/util';

const router: Router = Router();

import { authValidateOrReject } from '../middleware/jwt.strategy';
import { upload } from '../middleware/uploadToS3';
import UploadController from '../controllers/upload.controller';

router.post(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(upload.array('file', 5)), // 한번에 업로드 가능한 파일 개수는 5개로 제한
  asyncWrap(UploadController.uploadFiles)
);

router.delete(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(UploadController.deleteUploadFile)
);

export default router;
