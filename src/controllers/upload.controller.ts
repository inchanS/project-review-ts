import { Request, Response } from 'express';
import uploadService from '../services/upload.service';

// 파일 업로드를 처리하는 API 엔드포인트 ----------------------
const uploadFiles = async (req: Request, res: Response) => {
  const userId: number = req.userInfo.id;
  const files = req.files as Express.Multer.File[];
  const result = await uploadService.uploadFiles(userId, files);
  await res.status(201).send({
    file_links: result,
  });
};

// 파일 삭제를 처리하는 API 엔드포인트 ----------------------
const deleteUploadFile = async (req: Request, res: Response) => {
  const { file_links } = req.body;
  const userId: number = req.userInfo.id;

  // feeds.service에서 본 함수를 사용할때, mySQL의 테이블에서 삭제하는 로직은 필요가 없기때문에 구분 조건을 만들어준다.
  file_links.push('DELETE_FROM_UPLOAD_FILES_TABLE');

  await uploadService.deleteUploadFile(userId, file_links);

  await res.status(204).send();
};

export default { uploadFiles, deleteUploadFile };
