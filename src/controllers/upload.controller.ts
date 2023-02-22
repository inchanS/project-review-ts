import { Request, Response } from 'express';
import uploadService from '../services/upload.service';

// 파일 업로드를 처리하는 API 엔드포인트 ----------------------
const uploadFiles = async (req: Request, res: Response) => {
  const userId: number = req.userInfo.id;
  const file: Express.Multer.File = req.file;

  const result = await uploadService.uploadFiles(userId, file);
  // TODO res에서 middleware로 보내며 아래 함수를 객체로 바꾸고 createFeed.controller.ts에서 사용
  await res.send({
    file_link: result,
  });
};

// 파일 삭제를 처리하는 API 엔드포인트 ----------------------
const deleteUploadFile = async (req: Request, res: Response) => {
  const { file_link } = req.body;

  await uploadService.deleteUploadFile(file_link);

  await res.status(204).send();
};

export default { uploadFiles, deleteUploadFile };
