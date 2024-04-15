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
import { Feed } from '../../entities/feed.entity';

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
        expect(result.body.result.status.id).toBe(2);
        expect(result.body.result.content).toBe(feedInfo.content);
        expect(result.body.result.uploadFiles.length).toBe(0);
      });

      test('create temp feed with uploadFiles', async () => {
        const postBody: TestTempFeedDto = {
          content: feedInfo.content,
          fileLinks: [uploadFiles1.file_link],
        };

        const apiResult: Response = await ApiRequestHelper.makeAuthPostRequest(
          token,
          endpoint,
          postBody
        );

        const DBResult: UploadFiles[] = await dataSource.manager.find(
          UploadFiles,
          {
            loadRelationIds: true,
            where: { feed: { id: apiResult.body.result.id } },
          }
        );

        expect(apiResult.status).toBe(201);
        expect(apiResult.body.message).toBe('create temporary feed success');
        expect(Object.keys(apiResult.body.result).length).toBe(13);
        expect(apiResult.body.result.user.id).toBe(existingUser.id);
        expect(apiResult.body.result.status.id).toBe(2);
        expect(apiResult.body.result.content).toBe(feedInfo.content);
        // Response 값의 uploadFiles 확인
        expect(apiResult.body.result.uploadFiles.length).toBe(1);
        expect(apiResult.body.result.uploadFiles[0].id).toBe(uploadFiles1.id);
        expect(apiResult.body.result.uploadFiles[0].file_link).toBe(
          uploadFiles1.file_link
        );
        expect(apiResult.body.result.uploadFiles[0].file_name).toBe(
          uploadFiles1.file_name
        );

        // uploadFiles DB에서의 Feed 연결 및 사용자 확인
        expect(DBResult.length).toBe(1);
        expect(DBResult[0].user).toBe(existingUser.id);
        expect(DBResult[0].feed).toBe(apiResult.body.result.id);
      });
    });

    describe('update temp feed', () => {
      const endpoint: string = '/feeds/temp';

      const existingTempFeedWithoutUploadfiles: Feed = new MakeTestClass(
        1,
        existingUser.id
      ).tempFeedData();

      beforeEach(async () => {
        await dataSource.manager.save(Feed, existingTempFeedWithoutUploadfiles);
      });

      test('update title of temp feed', async () => {
        const patchBody = {
          feedId: existingTempFeedWithoutUploadfiles.id,
          title: 'this is title',
        };

        const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
          token,
          endpoint,
          patchBody
        );
        expect(result.status).toBe(200);
        expect(result.body.message).toBe('update temporary feed success');
        expect(result.body.result.title).toBe('this is title');
      });

      test('update content of temp feed', async () => {
        const patchBody = {
          feedId: existingTempFeedWithoutUploadfiles.id,
          content: 'this is update content',
        };

        const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
          token,
          endpoint,
          patchBody
        );

        expect(result.status).toBe(200);
        expect(result.body.message).toBe('update temporary feed success');
        expect(result.body.result.content).toBe(patchBody.content);
      });

      test('update estimation and category of temp feed', async () => {
        const patchBody = {
          feedId: existingTempFeedWithoutUploadfiles.id,
          estimation: 1,
          category: 1,
        };

        const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
          token,
          endpoint,
          patchBody
        );

        expect(result.status).toBe(200);
        expect(result.body.message).toBe('update temporary feed success');
        expect(result.body.result.estimation.id).toBe(1);
        expect(result.body.result.category.id).toBe(1);
      });

      test('update fileLinks of temp feed', async () => {
        const patchBody = {
          feedId: existingTempFeedWithoutUploadfiles.id,
          fileLinks: [uploadFiles1.file_link],
        };

        const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
          token,
          endpoint,
          patchBody
        );

        expect(result.status).toBe(200);
        expect(result.body.result.uploadFiles.length).toBe(1);
        expect(result.body.result.uploadFiles[0].id).toBe(uploadFiles1.id);
      });
    });
  });
});
