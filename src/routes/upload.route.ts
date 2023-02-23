import { Router } from 'express';
import { asyncWrap } from '../utils/util';
const router = Router();

import { authValidateOrReject } from '../middleware/jwt.strategy';
import { upload } from '../middleware/uploadToS3';
import uploadController from '../controllers/upload.controller';

router.post(
  '',
  asyncWrap(authValidateOrReject),
  asyncWrap(upload.array('file', 5)),
  asyncWrap(uploadController.uploadFiles)
);

router.delete('', asyncWrap(uploadController.deleteUploadFile));

export default router;
