import dataSource from '../../repositories/data-source';
import { TestUtils } from './testUtils/testUtils';
import { Response } from 'superagent';
import { TestUserFactory } from './testUtils/testUserFactory';
import { User } from '../../entities/users.entity';
import { ApiRequestHelper } from './testUtils/apiRequestHelper';
import { TempFeedDto } from '../../entities/dto/tempFeed.dto';
import {
  TestFeedDto,
  TestSignIn,
  TestTempFeedDto,
  TestUserInfo,
} from '../../types/test';
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
    const uploadFiles3: UploadFiles = new MakeTestClass(
      3,
      existingUser.id
    ).uploadData('testfile3.txt');

    const testUploadFiles: UploadFiles[] = [
      uploadFiles1,
      uploadFiles2,
      uploadFiles3,
    ];

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

      test('create a temp feed without uploadFiles', async () => {
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
        expect(result.body.result.status.is_status).toBe('temporary');
        expect(result.body.result.content).toBe(feedInfo.content);
        expect(result.body.result.uploadFiles.length).toBe(0);
      });

      test('create a temp feed with uploadFiles', async () => {
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
        expect(apiResult.body.result.status.is_status).toBe('temporary');
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

    describe('update a temp feed', () => {
      const endpoint: string = '/feeds/temp';

      const existingTempFeedWithoutUploadfiles: Feed = new MakeTestClass(
        1,
        existingUser.id
      ).tempFeedData();

      beforeEach(async () => {
        await dataSource.manager.save(Feed, existingTempFeedWithoutUploadfiles);
      });

      test('update title of a temp feed', async () => {
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
        expect(result.body.result.status.is_status).toBe('temporary');
      });

      test('update content of a temp feed', async () => {
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
        expect(result.body.result.status.is_status).toBe('temporary');
      });

      test('update estimation and category of a temp feed', async () => {
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
        expect(result.body.result.status.is_status).toBe('temporary');
        expect(result.body.result.estimation.id).toBe(1);
        expect(result.body.result.category.id).toBe(1);
      });

      test('update fileLinks of a temp feed', async () => {
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
        expect(result.body.result.status.is_status).toBe('temporary');
        expect(result.body.result.uploadFiles[0].id).toBe(uploadFiles1.id);
      });

      describe('update fileLinks of temp feed', () => {
        // 기존 임시 게시물에 업로드 파일이 하나 등록되어 있는 상태로 만든다.
        beforeEach(async () => {
          await dataSource.manager.update(
            UploadFiles,
            { id: uploadFiles1.id },
            { feed: existingTempFeedWithoutUploadfiles }
          );
        });

        test('update fileLinks of temp feed with fileLinks', async () => {
          // 다른 업로드 파일을 2개 등록하는 수정내용
          const patchBody = {
            feedId: existingTempFeedWithoutUploadfiles.id,
            fileLinks: [uploadFiles2.file_link, uploadFiles3.file_link],
          };

          const apiResult: Response =
            await ApiRequestHelper.makeAuthPatchRequest(
              token,
              endpoint,
              patchBody
            );

          const DBResult: UploadFiles[] = await dataSource.manager.find(
            UploadFiles,
            {
              loadRelationIds: true,
              withDeleted: true,
              where: {
                feed: { id: existingTempFeedWithoutUploadfiles.id },
              },
            }
          );

          // api Response 검사
          expect(apiResult.status).toBe(200);
          expect(apiResult.body.message).toBe('update temporary feed success');
          expect(apiResult.body.result.status.is_status).toBe('temporary');
          expect(apiResult.body.result.uploadFiles.length).toBe(2);
          expect(apiResult.body.result.uploadFiles[0].id).toBe(uploadFiles2.id);
          expect(apiResult.body.result.uploadFiles[1].id).toBe(uploadFiles3.id);

          // DB 검사
          // 기존 등록되어있던 업로드 파일 1개 + 수정된 업로드 파일 2개 = 3개
          expect(DBResult.length).toBe(3);
          // 기존 등록되어있던 업로드 파일은 softDelete 처리 되어야 한다.
          expect(
            DBResult.find(item => item.id === uploadFiles1.id)?.deleted_at
          ).not.toBe(null);
        });

        test('update without fileLinks of temp feed with fileLinks', async () => {
          const patchBody = {
            feedId: existingTempFeedWithoutUploadfiles.id,
          };

          const apiResult: Response =
            await ApiRequestHelper.makeAuthPatchRequest(
              token,
              endpoint,
              patchBody
            );

          const DBResult: UploadFiles[] = await dataSource.manager.find(
            UploadFiles,
            {
              loadRelationIds: true,
              withDeleted: true,
              where: { user: { id: existingUser.id } },
            }
          );

          expect(apiResult.status).toBe(200);
          expect(apiResult.body.message).toBe('update temporary feed success');
          expect(apiResult.body.result.status.is_status).toBe('temporary');
          expect(apiResult.body.result.uploadFiles.length).toBe(0);

          // 기존 사용자가 업로드한 모든 파일은 3개이고 그 중 1개가 기존 게시물과 연결되어 있었다.
          // 때문에 게시물 수정시 업로드 파일이 없다면 모든 사용자의 모든 업로드 파일들은 사용되지 않는 것으로 간주하여 모두 제거되어야 한다.
          expect(DBResult.length).toBe(3);
          expect(DBResult.every(item => item.deleted_at !== null)).toBe(true);
        });
      });
    });

    describe('create a Regular feed', () => {
      const endpoint: string = '/feeds/post';
      const postBody: TestFeedDto = {
        title: 'test Feed Title',
        content: 'this is content of Test Feed',
        estimation: 1,
        category: 1,
      };
      const regexPostedAt: RegExp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

      test('create a feed without fileLinks', async () => {
        const result: Response = await ApiRequestHelper.makeAuthPostRequest(
          token,
          endpoint,
          postBody
        );

        const apiResult = result.body.result;

        expect(result.status).toBe(201);
        expect(result.body.message).toBe('create feed success');
        expect(apiResult.title).toBe('test Feed Title');
        expect(apiResult.content).toBe('this is content of Test Feed');
        expect(apiResult.estimation.id).toBe(postBody.estimation);
        expect(apiResult.category.id).toBe(postBody.category);
        expect(apiResult.status.is_status).toBe('published');
        expect(regexPostedAt.test(apiResult.posted_at)).toBe(true);
      });

      test('create a feed with fileLinks', async () => {
        postBody.fileLinks = [uploadFiles1.file_link, uploadFiles2.file_link];

        const result: Response = await ApiRequestHelper.makeAuthPostRequest(
          token,
          endpoint,
          postBody
        );

        const dbResult: UploadFiles[] = await dataSource.manager.find(
          UploadFiles,
          {
            loadRelationIds: true,
            where: { user: { id: existingUser.id } },
          }
        );

        console.log('🔥feeds.api.test/:392- dbResult = ', dbResult);

        const apiResult = result.body.result;

        expect(result.status).toBe(201);
        expect(result.body.message).toBe('create feed success');
        expect(apiResult.title).toBe('test Feed Title');
        expect(apiResult.content).toBe('this is content of Test Feed');
        expect(apiResult.estimation.id).toBe(postBody.estimation);
        expect(apiResult.category.id).toBe(postBody.category);
        expect(apiResult.status.is_status).toBe('published');
        expect(regexPostedAt.test(apiResult.posted_at)).toBe(true);

        // uploadFiles check
        expect(apiResult.uploadFiles.length).toBe(2);
        expect(
          apiResult.uploadFiles.find(
            (item: UploadFiles) => item.id === uploadFiles1.id
          ).file_link
        ).toBe(uploadFiles1.file_link);
        expect(
          apiResult.uploadFiles.find(
            (item: UploadFiles) => item.id === uploadFiles2.id
          ).file_link
        ).toBe(uploadFiles2.file_link);

        // DB check
        expect(
          dbResult.find(
            (item: UploadFiles): boolean => item.id === uploadFiles1.id
          )!.feed
        ).toBe(apiResult.id);
        expect(
          dbResult.find(
            (item: UploadFiles): boolean => item.id === uploadFiles2.id
          )!.feed
        ).toBe(apiResult.id);
      });
    });
  });
});
