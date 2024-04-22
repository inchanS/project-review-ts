import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { createUploadService } from '../utils/serviceFactory';

class UploadController {
  constructor(private uploadService: UploadService) {}
  // 파일 업로드를 처리하는 API 엔드포인트 ----------------------
  uploadFiles = async (req: Request, res: Response): Promise<void> => {
    const userId: number = req.userInfo.id;
    const files: Express.Multer.File[] = req.files as Express.Multer.File[];
    const result: string[] = await this.uploadService.uploadFiles(
      userId,
      files
    );

    res.status(201).send({
      file_links: result,
    });
  };

  // 파일 삭제를 처리하는 API 엔드포인트 ----------------------
  deleteUploadFile = async (req: Request, res: Response): Promise<void> => {
    const { file_links } = req.body;
    const userId: number = req.userInfo.id;

    await this.uploadService.deleteUploadFile(userId, file_links);

    res.status(204).send();
  };
}

export default new UploadController(createUploadService());
