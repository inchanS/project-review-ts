import { UploadService } from '../../services/upload.service';
import crypto from 'crypto';
import { UserRepository } from '../../repositories/user.repository';
import { User } from '../../entities/users.entity';
import fs from 'fs';
import dataSource from '../../repositories/data-source';
import { UploadFiles } from '../../entities/uploadFiles.entity';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../../middleware/uploadToS3';

jest.mock('@aws-sdk/client-s3');
jest.mock('crypto');
jest.mock('../../middleware/uploadToS3');

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
    jest.resetAllMocks();

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

    jest.mock('@aws-sdk/client-s3', () => {
      return {
        S3Client: jest.fn().mockImplementation(() => {
          return {
            send: jest.fn().mockResolvedValue({}),
          };
        }),
        PutObjectCommand: jest.fn().mockImplementation(params => params),
      };
    });

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

  // TODO : resizeImage 함수 테스트 코드 작성
  // test('uploadFiles - resizeImage 함수 테스트', async () => {});

  test.each([
    { fileName: 'test.jpeg', expect: true },
    { fileName: 'test.jpg', expect: true },
    { fileName: 'test.gif', expect: true },
    { fileName: 'test.png', expect: true },
    { fileName: 'test.pdf', expect: false },
    { fileName: 'test.txt', expect: false },
  ])(
    'uploadFiles - isImageFile 함수 테스트',
    async (item: { fileName: string; expect: boolean }) => {
      const result = uploadService.isImageFileToBoolean(item.fileName);
      expect(result).toBe(item.expect);
    }
  );

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

  test('uploadFiles - 성공: isImageFileToBoolean 함수 호출 확인', async () => {
    const mockIsImageFileToBoolean = jest
      .spyOn(uploadService, 'isImageFileToBoolean')
      .mockReturnValue(false);

    await uploadService.uploadFiles(userId, files);

    expect(mockIsImageFileToBoolean).toBeCalledTimes(2);
  });

  test('uploadFiles - 성공: 이미지 파일이 업로드되었을 때, resizeImage 함수를 호출하고 "isImage"의 boolean값이 제대로 전달되는지 확인', async () => {
    const mockResizeImage = jest
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
    expect(mockResizeImage).toBeCalledTimes(4);

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

  test('uploadFiles - PutObjectCommand 객체에 올바른 Parameter가 전달되는지 확인', async () => {
    jest
      .spyOn(uploadService, 'resizeImage')
      .mockImplementation(async (): Promise<any> => {
        return 'buffer';
      });

    jest.spyOn(s3, 'send').mockImplementationOnce(() => Promise.resolve());

    await uploadService.uploadFiles(userId, files);

    expect(PutObjectCommand).toBeCalledTimes(2);

    files.forEach((file, index) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${userId}/${mockFilename}.${file.filename.split('.').pop()}`,
        Body: 'buffer',
        ContentType: file.mimetype,
      };
      expect(PutObjectCommand).toHaveBeenNthCalledWith(index + 1, params);
    });
  });

  test('uploadFiles - 성공: S3로 업로드 중, 파라미터 전달 확인', async () => {
    const mockPutObjectCommandInstance = { testValue: 'this is a mock' };
    const PutObjectCommandMock = jest.fn(() => mockPutObjectCommandInstance);

    (PutObjectCommand as any) = PutObjectCommandMock;

    await uploadService.uploadFiles(userId, files);

    files.forEach((file, index) => {
      expect(s3.send).toHaveBeenNthCalledWith(
        index + 1,
        mockPutObjectCommandInstance
      );
    });
  });

  test('uploadFiles - 실패: S3로 업로드 중, 에러가 발생했을 때', async () => {
    jest.spyOn(s3, 'send').mockImplementationOnce(() => {
      throw new Error('S3 Error');
    });

    await expect(uploadService.uploadFiles(userId, files)).rejects.toThrow(
      `UPLOAD_FILE_FAIL: Error: S3 Error`
    );
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
