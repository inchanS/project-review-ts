import dataSource from '../../repositories/data-source';
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
import { FeedList } from '../../entities/viewEntities/viewFeedList.entity';
import { TestInitializer } from './testUtils/testInitializer';
import { Category } from '../../entities/category.entity';

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

TestInitializer.initialize('Feed CRUD API Test', () => {
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
      existingUser.id
    ).uploadData(1, 'testfile1.jpeg');
    const uploadFiles2: UploadFiles = new MakeTestClass(
      existingUser.id
    ).uploadData(2, 'testfile2.txt');
    const uploadFiles3: UploadFiles = new MakeTestClass(
      existingUser.id
    ).uploadData(3, 'testfile3.txt');

    const testUploadFiles: UploadFiles[] = [
      uploadFiles1,
      uploadFiles2,
      uploadFiles3,
    ];

    let token: string;
    beforeAll(async () => {
      await dataSource.manager.save(User, existingUserEntity);

      token = await ApiRequestHelper.getAuthToken(existingUserSigningInfo);
    });

    describe('create a Temp Feed ', () => {
      const endpoint: string = '/feeds/temp';
      const successMessage: string = 'create temporary feed success';
      const isStatus: string = 'temporary';

      const feedInfo: TempFeedDto = {
        user: existingUser.id,
        title: 'this is title',
        content: 'this is content',
        estimation: 1,
        category: 1,
      };

      afterEach(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await transactionalEntityManager.clear(UploadFiles);
          await transactionalEntityManager.clear(Feed);
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
        });
      });

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
        expect(result.body.message).toBe(successMessage);
        expect(Object.keys(result.body.result).length).toBe(12);
        expect(result.body.result.user.id).toBe(existingUser.id);
        expect(result.body.result.status.id).toBe(2);
        expect(result.body.result.status.is_status).toBe(isStatus);
        expect(result.body.result.content).toBe(feedInfo.content);
        expect(result.body.result.uploadFiles.length).toBe(0);
      });

      test('create a temp feed with uploadFiles', async () => {
        await dataSource.manager.save(UploadFiles, testUploadFiles);

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
        expect(apiResult.body.message).toBe(successMessage);
        expect(Object.keys(apiResult.body.result).length).toBe(12);
        expect(apiResult.body.result.user.id).toBe(existingUser.id);
        expect(apiResult.body.result.status.id).toBe(2);
        expect(apiResult.body.result.status.is_status).toBe(isStatus);
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
      const successMessage: string = 'update temporary feed success';
      const isStatus: string = 'temporary';

      const existingTempFeedWithoutUploadfiles: Feed = new MakeTestClass(
        existingUser.id
      ).tempFeedData(1);

      beforeEach(async () => {
        await dataSource.manager.save(Feed, existingTempFeedWithoutUploadfiles);
        await dataSource.manager.save(UploadFiles, testUploadFiles);
      });

      afterEach(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await transactionalEntityManager.clear(UploadFiles);
          await transactionalEntityManager.clear(Feed);
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
        });
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
        expect(result.body.message).toBe(successMessage);
        expect(result.body.result.title).toBe(patchBody.title);
        expect(result.body.result.status.is_status).toBe(isStatus);
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
        expect(result.body.message).toBe(successMessage);
        expect(result.body.result.content).toBe(patchBody.content);
        expect(result.body.result.status.is_status).toBe(isStatus);
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
        expect(result.body.message).toBe(successMessage);
        expect(result.body.result.status.is_status).toBe(isStatus);
        expect(result.body.result.estimation.id).toBe(patchBody.estimation);
        expect(result.body.result.category.id).toBe(patchBody.category);
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
          expect(apiResult.body.message).toBe(successMessage);
          expect(apiResult.body.result.status.is_status).toBe(isStatus);
          expect(apiResult.body.result.uploadFiles.length).toBe(
            patchBody.fileLinks.length
          );
          expect(apiResult.body.result.uploadFiles[0].id).toBe(uploadFiles2.id);
          expect(apiResult.body.result.uploadFiles[1].id).toBe(uploadFiles3.id);

          // DB 검사
          // 기존 등록되어있던 업로드 파일 1개 + 수정된 업로드 파일 2개 = 3개
          expect(DBResult.length).toBe(testUploadFiles.length);
          // 기존 등록되어있던 업로드 파일은 softDelete 처리 되어야 한다.
          expect(
            DBResult.find(item => item.id === uploadFiles1.id)?.deleted_at
          ).not.toBe(null);
        });

        test('update the temp feed by removing fileLinks from it', async () => {
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
          expect(apiResult.body.message).toBe(successMessage);
          expect(apiResult.body.result.status.is_status).toBe(isStatus);
          expect(apiResult.body.result.uploadFiles.length).toBe(0);

          // 기존 사용자가 업로드한 모든 파일은 3개이고 그 중 1개가 기존 게시물과 연결되어 있었다.
          // 때문에 게시물 수정시 업로드 파일이 없다면 모든 사용자의 모든 업로드 파일들은 사용되지 않는 것으로 간주하여 모두 제거되어야 한다.
          expect(DBResult.length).toBe(testUploadFiles.length);
          expect(DBResult.every(item => item.deleted_at !== null)).toBe(true);
        });
      });
    });

    describe('get a temp feed and temp feed list API test', () => {
      const expectedCode: number = 200;
      const expectedStatusId: number = 2;
      const regexDateValue: RegExp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

      // other Users data
      const otherUser: TestUserInfo = {
        id: 2,
        nickname: 'otherNickname',
        password: 'existingPassword@1234',
        email: 'otherEmail@email.com',
      };
      const otherUserEntity: TestUserInfo =
        TestUserFactory.createUserEntity(otherUser);

      // make feeds for test
      const tempTitle: string = 'this is title';

      const tempFeedWithoutTitle: Feed = new MakeTestClass(
        existingUser.id
      ).tempFeedData(1, undefined, 'this is new content');
      const tempFeedWithTitle: Feed = new MakeTestClass(
        existingUser.id
      ).tempFeedData(2, tempTitle);
      const tempFeedWithUploadFiles: Feed = new MakeTestClass(
        existingUser.id
      ).tempFeedData(3);
      const tempFeedList: Feed[] = new MakeTestClass(
        existingUser.id
      ).generateMultipleTempFeeds(3, 4);

      const existingUsersTempFeeds: Feed[] = [
        tempFeedWithoutTitle,
        tempFeedWithTitle,
        tempFeedWithUploadFiles,
        ...tempFeedList,
      ];

      const otherUsersTempFeed: Feed = new MakeTestClass(
        otherUser.id
      ).tempFeedData(7);

      const testTempFeeds: Feed[] = [
        ...existingUsersTempFeeds,
        otherUsersTempFeed,
      ];

      beforeEach(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.save(UploadFiles, testUploadFiles);
          await transactionalEntityManager.save(User, otherUserEntity);
          await transactionalEntityManager.save(Feed, testTempFeeds);
          // 사용자의 게시물에 uploadFiles 연결
          await transactionalEntityManager.update(
            UploadFiles,
            { id: uploadFiles1.id },
            { feed: tempFeedWithUploadFiles }
          );
          await transactionalEntityManager.update(
            UploadFiles,
            { id: uploadFiles2.id },
            { feed: tempFeedWithUploadFiles }
          );
        });
      });

      afterEach(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await transactionalEntityManager.clear(UploadFiles);
          await transactionalEntityManager.clear(Feed);
          await transactionalEntityManager.delete(User, otherUserEntity);
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
        });
      });

      async function getUploadFilesLength(): Promise<number> {
        const tempFeedsUploadFiles: UploadFiles[] =
          await dataSource.manager.find(UploadFiles, {
            loadRelationIds: true,
            where: {
              feed: tempFeedWithUploadFiles,
            },
          });
        return tempFeedsUploadFiles.length;
      }

      describe('get a temp feed api test', () => {
        const endpoint: string = '/feeds';
        const successMessage: string = 'check feed success';

        test('get a temp feed without title api test', async () => {
          const testEndpoint: string = `${endpoint}/${tempFeedWithoutTitle.id}`;
          const result: Response = await ApiRequestHelper.makeAuthGetRequest(
            token,
            testEndpoint
          );
          const resultBody: Feed = result.body.result;

          const alterUpdatedAt: string = resultBody.updated_at
            .toString()
            .replace(/^\d{2}/, '');
          const expectedTitle: string = `${alterUpdatedAt}에 임시저장된 글입니다.`;

          expect(result.status).toBe(expectedCode);
          expect(result.body.message).toBe(successMessage);
          expect(resultBody.id).toBe(tempFeedWithoutTitle.id);
          expect(resultBody.status.id).toBe(expectedStatusId);
          expect(resultBody.title).toBe(expectedTitle);
          expect(regexDateValue.test(resultBody.created_at.toString())).toBe(
            true
          );
          expect(regexDateValue.test(resultBody.updated_at.toString())).toBe(
            true
          );
        });

        test('get a temp feed with title api test', async () => {
          const testEndpoint: string = `${endpoint}/${tempFeedWithTitle.id}`;
          const result: Response = await ApiRequestHelper.makeAuthGetRequest(
            token,
            testEndpoint
          );
          const resultBody = result.body.result;

          expect(result.status).toBe(expectedCode);
          expect(result.body.message).toBe(successMessage);
          expect(resultBody.id).toBe(tempFeedWithTitle.id);
          expect(resultBody.status.id).toBe(expectedStatusId);
          expect(resultBody.title).toBe(tempTitle);
          expect(regexDateValue.test(resultBody.created_at)).toBe(true);
          expect(regexDateValue.test(resultBody.updated_at)).toBe(true);
        });

        test('get a otherUsers temp feed api test', async () => {
          const testEndpoint: string = `${endpoint}/${otherUsersTempFeed.id}`;

          const expectedCode: number = 403;
          const expectedErrorMessage: string =
            'UNAUTHORIZED_TO_ACCESS_THE_POST';

          const result: Response = await ApiRequestHelper.makeAuthGetRequest(
            token,
            testEndpoint
          );

          expect(result.status).toBe(expectedCode);
          expect(result.body.message).toBe(expectedErrorMessage);
        });

        test('get a temp feed without token', async () => {
          const testEndpoint: string = `${endpoint}/${tempFeedWithoutTitle.id}`;
          const expectedStatusCode: number = 403;
          const expectedMessage: string = 'UNAUTHORIZED_TO_ACCESS_THE_POST';

          const result: Response = await ApiRequestHelper.makeAuthGetRequest(
            '',
            testEndpoint
          );

          expect(result.status).toBe(expectedStatusCode);
          expect(result.body.message).toBe(expectedMessage);
        });

        test('get a Non-Existent Feed', async () => {
          const nonExistentPost: number = 300;
          const testEndpoint: string = `${endpoint}/${nonExistentPost}`;
          const expectedStatusCode: number = 404;
          const expectedMessage: string = 'NOT_FOUND_FEED';

          const result: Response = await ApiRequestHelper.makeAuthGetRequest(
            token,
            testEndpoint
          );

          expect(result.status).toBe(expectedStatusCode);
          expect(result.body.message).toBe(expectedMessage);
        });

        test('get a temp feed with uploadFiles api test', async () => {
          const testEndpoint: string = `${endpoint}/${tempFeedWithUploadFiles.id}`;
          const expectedStatusCode: number = 200;

          const result: Response = await ApiRequestHelper.makeAuthGetRequest(
            token,
            testEndpoint
          );

          const countUploadFiles: number = await getUploadFilesLength();

          expect(result.status).toBe(expectedStatusCode);
          expect(result.body.message).toBe(successMessage);
          expect(result.body.result.uploadFiles).toHaveLength(countUploadFiles);
        });
      });

      describe('get temp feed list API test', () => {
        const endpoint: string = '/feeds/temp';
        const expectedMessage: string = 'check temporary feed success';

        test('get temp feed list api test', async () => {
          const result: Response = await ApiRequestHelper.makeAuthGetRequest(
            token,
            endpoint
          );
          const resultBody = result.body.result;

          const tempFeedWithoutTitleOfTempFeedList: FeedList = resultBody.find(
            (item: FeedList) => item.id === tempFeedWithoutTitle.id
          );
          const alterUpdatedAt: string =
            tempFeedWithoutTitleOfTempFeedList.updatedAt
              .toString()
              .replace(/^\d{2}/, '');
          const expectedTitle: string = `${alterUpdatedAt}에 임시저장된 글입니다.`;

          expect(result.status).toBe(expectedCode);
          expect(result.body.message).toBe(expectedMessage);
          expect(resultBody).toHaveLength(existingUsersTempFeeds.length);
          expect(
            resultBody.every(
              (item: FeedList) => item.statusId === expectedStatusId
            )
          );
          expect(
            resultBody.every(
              (item: FeedList) => item.userId === existingUser.id
            )
          );
          expect(tempFeedWithoutTitleOfTempFeedList.title).toBe(expectedTitle);
        });
      });
    });

    describe('create a feed', () => {
      const endpoint: string = '/feeds/post';
      const successMessage: string = 'create feed success';
      const isStatus: string = 'published';

      const postBody: TestFeedDto = {
        title: 'test Feed Title',
        content: 'this is content of Test Feed',
        estimation: 1,
        category: 1,
        fileLinks: [],
      };

      const tempFeedId: number = 100;
      const tempFeedInfo: Feed = new MakeTestClass(
        existingUser.id
      ).tempFeedData(tempFeedId, 'test title');

      beforeEach(async () => {
        await dataSource.manager.save(Feed, tempFeedInfo);
        await dataSource.manager.save(UploadFiles, testUploadFiles);
      });

      afterEach(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await transactionalEntityManager.clear(Feed);
          await transactionalEntityManager.clear(UploadFiles);
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
        });
      });

      interface ExtendedTestFeedDto extends TestFeedDto {
        feedId: number;
      }

      const tempPostBody: ExtendedTestFeedDto = {
        ...postBody,
        feedId: tempFeedId,
      };

      const regexPostedAt: RegExp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

      const validateApiResponse = (
        result: Response,
        body: TestFeedDto | ExtendedTestFeedDto
      ) => {
        expect(result.status).toBe(201);
        expect(result.body.message).toBe(successMessage);
        expect(result.body.result.title).toBe(body.title);
        expect(result.body.result.content).toBe(body.content);
        expect(result.body.result.estimation.id).toBe(body.estimation);
        expect(result.body.result.category.id).toBe(body.category);
        expect(result.body.result.status.is_status).toBe(isStatus);
        expect(
          regexPostedAt.test(result.body.result.posted_at as unknown as string)
        ).toBe(true);
      };

      // TODO 임시저장된 게시글, 즉 feedId가 있는 게시글을 정식게시글로 등록할때의 테스트 추가
      //   1. beforeAll 함수에 임시저장 게시글 하나를 엔티티로 등록
      //   2. 검증해야할 postBody값과 임시저장 게시글 값을 배열로 묶은 후,
      //   3. 이하 test 코드를 test.each 코드로 수정

      test.each([postBody, tempPostBody])(
        'create a feed without fileLinks',
        async (body: TestFeedDto | ExtendedTestFeedDto) => {
          const result: Response = await ApiRequestHelper.makeAuthPostRequest(
            token,
            endpoint,
            body
          );

          const apiResult = result.body.result;

          validateApiResponse(result, body);
          expect(apiResult.uploadFiles).toHaveLength(body.fileLinks!.length);
        }
      );

      test.each([postBody, tempPostBody])(
        'create a feed with fileLinks',
        async (body: TestFeedDto | ExtendedTestFeedDto) => {
          const uploadFilesForPost: UploadFiles[] = [
            uploadFiles1,
            uploadFiles2,
          ];

          const uploadFilesForTempPost: UploadFiles[] = [uploadFiles3];

          postBody.fileLinks = uploadFilesForPost.map(
            (file: UploadFiles) => file.file_link
          );
          tempPostBody.fileLinks = uploadFilesForTempPost.map(
            (file: UploadFiles) => file.file_link
          );

          console.log(
            '🔥feeds.api.test/:670- await dataSource.manager.find(UploadFiles) = ',
            await dataSource.manager.find(UploadFiles)
          );
          console.log(
            '🔥feeds.api.test/:674- await dataSource.manager.find(Feed) = ',
            await dataSource.manager.find(Feed)
          );

          console.log('🔥feeds.api.test/:670- body = ', body);
          const result: Response = await ApiRequestHelper.makeAuthPostRequest(
            token,
            endpoint,
            body
          );

          console.log('🔥feeds.api.test/:677- result.body = ', result.body);

          const dbResult: UploadFiles[] = await dataSource.manager.find(
            UploadFiles,
            {
              loadRelationIds: true,
              where: { user: { id: existingUser.id } },
            }
          );

          const apiResult = result.body.result;

          validateApiResponse(result, body);

          // uploadFiles check
          expect(apiResult.uploadFiles).toHaveLength(body.fileLinks?.length!);

          apiResult.uploadFiles.forEach((files: UploadFiles) => {
            let uploadFile: UploadFiles | undefined = testUploadFiles.find(
              (item: UploadFiles) => item.id === files.id
            );
            expect(files.file_link).toBe(uploadFile?.file_link);
          });

          // DB check
          if ((body as ExtendedTestFeedDto).feedId) {
            uploadFilesForTempPost.forEach((files: UploadFiles) => {
              expect(
                dbResult.find(
                  (item: UploadFiles): boolean => item.id === files.id
                )!.feed
              ).toBe(apiResult.id);
            });
          } else {
            uploadFilesForPost.forEach((files: UploadFiles) => {
              expect(
                dbResult.find(
                  (item: UploadFiles): boolean => item.id === files.id
                )!.feed
              ).toBe(apiResult.id);
            });
          }
        }
      );
    });

    describe('update a feed', () => {
      const endpoint: string = '/feeds/post';
      const successMessage: string = 'update feed success';
      const isStatus: string = 'published';
      const updateStatusCode: number = 200;

      const existingFeed: Feed = new MakeTestClass(existingUser.id).feedData(
        1,
        'existing title',
        'existing content'
      );

      beforeEach(async () => {
        await dataSource.manager.save(UploadFiles, testUploadFiles);
        await dataSource.manager.save(Feed, existingFeed);
      });

      afterEach(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await transactionalEntityManager.clear(UploadFiles);
          await transactionalEntityManager.clear(Feed);
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
        });
      });

      async function performPatchAndUpdateValidation(
        beforeDB: Feed | null,
        patchBody: Partial<Feed>,
        expectedContendUpdates: Partial<Feed>,
        expectedEntityUpdates?: Record<any, number>
      ) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
          token,
          endpoint,
          patchBody
        );
        const apiResult = result.body.result;

        expect(result.status).toBe(updateStatusCode);
        expect(result.body.message).toBe(successMessage);
        expect(apiResult.status.is_status).toBe(isStatus);
        for (const key in expectedContendUpdates) {
          expect(apiResult[key]).toEqual(
            expectedContendUpdates[key as keyof Feed]
          );
        }

        for (const key in expectedEntityUpdates) {
          expect(apiResult[key].id).toEqual(expectedEntityUpdates[key]);
        }

        expect(beforeDB!.updated_at !== apiResult.updated_at).toBe(true);
      }

      test('update the title of a feed without using fileLinks', async () => {
        const patchBody = {
          feedId: existingFeed.id,
        };
        const patchContent = {
          title: 'update title',
        };
        const updatedPatchBody = { ...patchBody, ...patchContent };

        const beforeDB: Feed | null = await dataSource.manager.findOne(Feed, {
          loadRelationIds: true,
          where: { id: existingFeed.id },
        });

        await performPatchAndUpdateValidation(
          beforeDB,
          updatedPatchBody,
          patchContent
        );
      });

      test('update the content and category of a feed without using fileLinks', async () => {
        const patchBody = {
          feedId: existingFeed.id,
        };
        const patchContent = {
          content: 'update content',
        };
        const patchEntity = {
          category: 2 as unknown as Category,
        };

        const updatedPatchBody: Partial<Feed> = {
          ...patchBody,
          ...patchContent,
          ...patchEntity,
        };

        const beforeDB: Feed | null = await dataSource.manager.findOne(Feed, {
          loadRelationIds: true,
          where: { id: existingFeed.id },
        });

        await performPatchAndUpdateValidation(
          beforeDB,
          updatedPatchBody,
          patchContent
        );
      });

      describe('update the feed with using fileLinks', () => {
        beforeEach(async () => {
          await dataSource.manager.save(UploadFiles, testUploadFiles);
          await dataSource.manager.update(
            UploadFiles,
            { id: uploadFiles1.id },
            { feed: existingFeed }
          );
        });

        afterEach(async () => {
          await dataSource.transaction(async transactionalEntityManager => {
            await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
            await transactionalEntityManager.clear(UploadFiles);
            await transactionalEntityManager.clear(Feed);
            await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
          });
        });

        async function performPatchAndUpdateFileLinksValidation(
          patchBody: Partial<Feed>,
          expectedContendUpdates: Partial<Feed>,
          expectedFileLength: { fileLinks: string[] }
        ) {
          const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
            token,
            endpoint,
            patchBody
          );
          const apiResult = result.body.result;

          const afterDB: UploadFiles[] = await dataSource.manager.find(
            UploadFiles,
            {
              loadRelationIds: true,
              withDeleted: true,
              where: { user: { id: existingUser.id } },
            }
          );

          expect(result.status).toBe(updateStatusCode);
          expect(result.body.message).toBe(successMessage);
          expect(apiResult.status.is_status).toBe(isStatus);
          for (const key in expectedContendUpdates) {
            expect(apiResult[key]).toEqual(
              expectedContendUpdates[key as keyof Feed]
            );
          }
          expect(apiResult.uploadFiles).toHaveLength(
            expectedFileLength.fileLinks.length
          );

          return { apiResult, afterDB };
        }

        test('update the title of a feed with using fileLinks', async () => {
          const patchBody = {
            feedId: existingFeed.id,
          };
          const patchContent = {
            title: 'update title',
          };
          const fileLinks = {
            fileLinks: [uploadFiles2.file_link, uploadFiles3.file_link],
          };

          const updatedPatchBody = {
            ...patchBody,
            ...patchContent,
            ...fileLinks,
          };

          const beforeDB: UploadFiles[] = await dataSource.manager.find(
            UploadFiles,
            {
              loadRelationIds: true,
              where: { user: { id: existingUser.id } },
            }
          );

          const result = await performPatchAndUpdateFileLinksValidation(
            updatedPatchBody,
            patchContent,
            fileLinks
          );

          expect(
            beforeDB.find((item: UploadFiles) => item.id === uploadFiles1.id)
              ?.deleted_at
          ).toBe(null);
          expect(
            result.afterDB.find(
              (item: UploadFiles) => item.id === uploadFiles1.id
            )?.deleted_at
          ).not.toBe(null);
          expect(
            result.afterDB.find(
              (item: UploadFiles) => item.id === uploadFiles2.id
            )?.feed
          ).toBe(existingFeed.id);
          expect(
            result.afterDB.find(
              (item: UploadFiles) => item.id === uploadFiles3.id
            )?.feed
          ).toBe(existingFeed.id);
        });

        test('update the feed by removing fileLinks from it', async () => {
          const patchBody = {
            feedId: existingFeed.id,
          };
          const patchContent = {
            title: 'update title',
          };
          const fileLinks = {
            fileLinks: [],
          };

          const updatedPatchBody = {
            ...patchBody,
            ...patchContent,
            ...fileLinks,
          };

          const result = await performPatchAndUpdateFileLinksValidation(
            updatedPatchBody,
            patchContent,
            fileLinks
          );

          expect(
            result.afterDB.find(
              (item: UploadFiles) => item.id === uploadFiles1.id
            )?.deleted_at
          ).not.toBe(null);
        });
      });
    });

    describe('get a feed: success', () => {
      const endpoint: string = '/feeds/';
      const successCode: number = 200;
      const expectedMessage: string = 'check feed success';

      const existingUsersFeed: Feed = new MakeTestClass(1).feedData(1);
      const uploadFilesForFeed: UploadFiles[] = [uploadFiles1, uploadFiles2];

      let result: Response;
      let apiResult: Feed;

      beforeAll(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.save(UploadFiles, testUploadFiles);
          await transactionalEntityManager.save(Feed, existingUsersFeed);
          await transactionalEntityManager.update(
            UploadFiles,
            { id: uploadFiles1.id },
            { feed: existingUsersFeed }
          );
          await transactionalEntityManager.update(
            UploadFiles,
            { id: uploadFiles2.id },
            { feed: existingUsersFeed }
          );
        });

        result = await ApiRequestHelper.makeAuthGetRequest(
          token,
          endpoint + existingUsersFeed.id
        );
        apiResult = result.body.result;
      });

      afterAll(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await transactionalEntityManager.clear(UploadFiles);
          await transactionalEntityManager.clear(Feed);
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
        });
      });

      test('check status and message', async () => {
        expect(result.status).toBe(successCode);
        expect(result.body.message).toBe(expectedMessage);
      });

      test('check feeds title and content', async () => {
        expect(apiResult.title).toBe(existingUsersFeed.title);
        expect(apiResult.content).toBe(existingUsersFeed.content);
        expect(apiResult.status.is_status).toBe('published');
        expect(apiResult.category.id).toBe(existingUsersFeed.category);
        expect(apiResult.estimation.id).toBe(existingUsersFeed.estimation);
      });

      test('check uploadFiles for feed', async () => {
        expect(apiResult.uploadFiles).toHaveLength(uploadFilesForFeed.length);

        const uploadFileIds: number[] = apiResult.uploadFiles!.map(
          (file: UploadFiles) => file.id
        );

        expect(uploadFileIds).toContain(uploadFilesForFeed[0].id);
        expect(uploadFileIds).toContain(uploadFilesForFeed[1].id);
      });

      test('check verify increment in view count after feed', async () => {
        const secondGetFeed: Response =
          await ApiRequestHelper.makeAuthGetRequest(
            token,
            endpoint + existingUsersFeed.id
          );

        const beforeViewCnt: number = apiResult.viewCnt;
        const afterViewCnt: number = secondGetFeed.body.result.viewCnt;

        expect(afterViewCnt).toBe(beforeViewCnt + 1);
      });
    });

    describe('get a feed: not found feed', () => {
      const endpoint: string = '/feeds/';
      const wrongFeedId: number = 55;

      let result: Response;
      beforeAll(async () => {
        result = await ApiRequestHelper.makeAuthGetRequest(
          token,
          endpoint + wrongFeedId
        );
      });

      afterAll(async () => {
        await dataSource.transaction(async transactionalEntityManager => {
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=0;`);
          await transactionalEntityManager.clear(UploadFiles);
          await transactionalEntityManager.clear(Feed);
          await transactionalEntityManager.query(`SET FOREIGN_KEY_CHECKS=1;`);
        });
      });

      test('check statusCode, errMessage', async () => {
        const errCode: number = 404;
        const errMessage: string = 'NOT_FOUND_FEED';

        expect(result.status).toBe(errCode);
        expect(result.body.message).toBe(errMessage);
      });
    });
  });
});
