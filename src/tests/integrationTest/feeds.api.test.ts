import dataSource from '../../repositories/data-source';
import { TestUtils } from './testUtils/testUtils';
import { Response } from 'superagent';
import { TestUserFactory } from './testUtils/testUserFactory';
import { User } from '../../entities/users.entity';
import { ApiRequestHelper } from './testUtils/apiRequestHelper';
import { TempFeedDto } from '../../entities/dto/tempFeed.dto';
import { TestSignIn, TestTempFeedDto, TestUserInfo } from '../../types/test';
import { UploadFiles } from '../../entities/uploadFiles.entity';
import { MakeTestClass } from './testUtils/makeTestClass';

// @aws-sdk/client-s3 모의
jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...originalModule,
    S3Client: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
      }),
    })),
  };
});

describe('Feed CRUD API Test', () => {
  beforeAll(async () => {
    await dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'test') {
          console.log(
            '💥TEST Data Source for Feed CRUD API has been initialized!'
          );
        }
      })
      .catch(error => {
        console.log(
          'Data Source for Feed CRUD API Initializing failed:',
          error
        );
      });
  });

  afterAll(async () => {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy().then(() => {
      console.log('💥TEST Data Source for Feed CRUD API has been destroyed!');
    });
  });

  describe('set for feed CRUD API Test', () => {
    // test users
    const existingUser: TestUserInfo = {
      id: 1,
      nickname: 'existingNickname',
      password: 'existingPassword@1234',
      email: 'existingEmail@email.com',
    };

    const existingUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(existingUser);
    const existingUserSigningInfo: TestSignIn =
      TestUserFactory.createSignInInfo(existingUser);

    const uploadFiles1: UploadFiles = new MakeTestClass(
      1,
      existingUser.id
    ).uploadData('testfile1.jpeg');
    const uploadFiles2: UploadFiles = new MakeTestClass(
      2,
      existingUser.id
    ).uploadData('testfile2.txt');

    const testUploadFiles: UploadFiles[] = [uploadFiles1, uploadFiles2];

    let token: string;
    beforeEach(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(User, existingUserEntity);
        await transactionalEntityManager.save(UploadFiles, testUploadFiles);
      });
      token = await ApiRequestHelper.getAuthToken(existingUserSigningInfo);
    });
    afterEach(async () => {
      await TestUtils.clearDatabaseTables(dataSource);
    });

    describe('Create a Temp Feed ', () => {
      const endpoint: string = '/feeds/temp';

      const feedInfo: TempFeedDto = {
        user: existingUser.id,
        title: 'this is title',
        content: 'this is content',
        estimation: 1,
        category: 1,
      };

      test('create temp feed without uploadFiles', async () => {
        const postBody: TestTempFeedDto = {
          content: feedInfo.content,
        };

        const result: Response = await ApiRequestHelper.makeAuthPostRequest(
          token,
          endpoint,
          postBody
        );

        expect(result.status).toBe(201);
        expect(result.body.message).toBe('create temporary feed success');
        expect(Object.keys(result.body.result).length).toBe(13);
        expect(result.body.result.user.id).toBe(existingUser.id);
        expect(result.body.result.content).toBe(feedInfo.content);
      });

      test('create temp feed with uploadfiles', async () => {
        const postBody: TestTempFeedDto = {
          content: feedInfo.content,
          fileLinks: [uploadFiles1.file_link],
        };

        const result: Response = await ApiRequestHelper.makeAuthPostRequest(
          token,
          endpoint,
          postBody
        );

        expect(result.status).toBe(201);
      });
    });
  });
});
