import { UploadService } from '../../services/upload.service';
import crypto from 'crypto';
import { UserRepository } from '../../repositories/user.repository';
import { User } from '../../entities/users.entity';
import fs from 'fs';
import dataSource from '../../repositories/data-source';
import { UploadFiles } from '../../entities/uploadFiles.entity';

jest.mock('@aws-sdk/client-s3');
jest.mock('crypto');

describe('unit test - uploadFiles', () => {
  let uploadService: UploadService;

  const userId = 1;
  const mockUser: User = new User();
  mockUser.id = userId;

  const files: Express.Multer.File[] = [
    {
      fieldname: 'file1',
      originalname: 'test1.jpg',
      encoding: 'binary',
      mimetype: 'image/jpeg',
      size: 5000, // 바이트 단위
      destination: '/tmp',
      filename: 'test1.jpg',
      path: '/tmp/test1.jpg',
      buffer: fs.readFileSync('src/tests/testSampleFiles/width1200.png'),
      stream: null, // null 또는 원하는 형식으로 설정
    },
    {
      fieldname: 'file2',
      originalname: 'test2.png',
      encoding: 'binary',
      mimetype: 'image/png',
      size: 7000, // 바이트 단위
      destination: '/tmp',
      filename: 'test2.png',
      path: '/tmp/test2.png',
      buffer: fs.readFileSync('src/tests/testSampleFiles/width3914.png'),
      stream: null, // null 또는 원하는 형식으로 설정
    },
  ];

  const mockFilename: string = '1234567890randomBytes';

  beforeEach(() => {
    uploadService = new UploadService();

    jest.mock('typeorm', () => {
      return {
        getRepository: jest.fn().mockImplementation(() => ({
          create: jest.fn(),
          save: jest.fn(),
        })),
      };
    });

    jest
      .spyOn(UserRepository.prototype, 'findOneOrFail')
      .mockResolvedValue(mockUser);

    jest.spyOn(crypto, 'randomBytes').mockImplementation(() => {
      return 'randomBytes';
    });

    jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    jest
      .spyOn(dataSource.getRepository(UploadFiles), 'create')
      .mockImplementation(() => new UploadFiles());

    jest
      .spyOn(dataSource.getRepository(UploadFiles), 'save')
      .mockResolvedValue(new UploadFiles());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('uploadFiles - 실패: userId가 찾을 수 없는 사용자일 때', async () => {
    jest
      .spyOn(UserRepository.prototype, 'findOneOrFail')
      .mockRejectedValueOnce(new Error('User not found'));

    await expect(
      uploadService.uploadFiles(userId, files)
    ).rejects.toMatchObject({
      status: 400,
      message: 'INVALID_USER',
    });
  });

  test('uploadFiles - 성공: 이미지 파일이 업로드되었을 때, isImage가 true인지 확인', async () => {
    jest
      .spyOn(uploadService, 'resizeImage')
      .mockImplementation(async (buffer: Buffer) => buffer);

    const fileExtensions = ['txt', 'jpeg', 'png', 'gif', 'jpg'];

    const fileTemplate: any = {
      fieldname: '',
      originalname: '',
      encoding: 'binary',
      mimetype: '',
      size: 5000, // 바이트 단위
      destination: '/tmp',
      filename: '',
      path: '',
      buffer: null,
      stream: null, // null 또는 원하는 형식으로 설정
    };

    const imgFiles: Express.Multer.File[] = fileExtensions.map((ext, index) => {
      const newFile = { ...fileTemplate };
      newFile.fieldname = `file${index + 1}`;
      newFile.originalname = `test${index + 1}.${ext}`;
      newFile.mimetype = `image/${ext}`;
      newFile.filename = `test${index + 1}.${ext}`;
      return newFile;
    });

    await uploadService.uploadFiles(userId, imgFiles);

    const expectedIsImage = [false, true, true, true, true];

    // Jest의 toHaveBeenNthCalledWith 함수는 호출 순서를 1부터 시작으로 계산한다.
    // 그러나 JavaScript의 배열 인덱스는 0부터 시작한다.
    // 따라서, 배열의 각 요소별 호출을 확인하려면, index + 1을 사용해야 한다.
    imgFiles.forEach((file, index) => {
      expect(
        dataSource.getRepository(UploadFiles).create
      ).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({
          is_img: expectedIsImage[index],
        })
      );
    });
  });

  test('uploadFiles - 성공: S3로 업로드할 때 fileLink의 주소가 제대로 변환되어 변환되는지 확인', async () => {
    const result: any = await uploadService.uploadFiles(userId, files);

    files.forEach((file, index) => {
      const expectedFileLink = `https://${process.env.AWS_S3_BUCKET}.s3.${
        process.env.AWS_REGION
      }.amazonaws.com/${userId}/${mockFilename}.${files[index].filename
        .split('.')
        .pop()}`;
      expect(result[index]).toBe(expectedFileLink);
    });
  });
});
