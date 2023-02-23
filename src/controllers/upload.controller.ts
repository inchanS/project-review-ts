import { Request, Response } from 'express';
import uploadService from '../services/upload.service';

// 파일 업로드를 처리하는 API 엔드포인트 ----------------------
const uploadFiles = async (req: Request, res: Response) => {
  const userId: number = req.userInfo.id;
  const files = req.files as Express.Multer.File[];
  const result = await uploadService.uploadFiles(userId, files);
  await res.send({
    file_link: result,
  });
};

// 파일 삭제를 처리하는 API 엔드포인트 ----------------------
const deleteUploadFile = async (req: Request, res: Response) => {
  const { file_links } = req.body;

  await uploadService.deleteUploadFile(file_links);

  await res.status(204).send();
};

export default { uploadFiles, deleteUploadFile };
