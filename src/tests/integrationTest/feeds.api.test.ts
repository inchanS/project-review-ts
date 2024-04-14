import dataSource from '../../repositories/data-source';
import { TestUtils } from './testUtils/testUtils';
import { Response } from 'superagent';
import { TestUserFactory } from './testUtils/testUserFactory';
import { User } from '../../entities/users.entity';
import { ApiRequestHelper } from './testUtils/apiRequestHelper';
import { createApp } from '../../app';
import { TempFeedDto } from '../../entities/dto/tempFeed.dto';
import { Express } from 'express';

const app: Express = createApp();

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

    beforeEach(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(User, existingUserEntity);
      });
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
        const postBody = {
          content: feedInfo.content,
        };

        const result: Response = await ApiRequestHelper.makeAuthPostRequest(
          app,
          existingUserSigningInfo,
          endpoint,
          postBody
        );

        expect(result.status).toBe(201);
        expect(result.body.message).toBe('create temporary feed success');
        expect(Object.keys(result.body.result).length).toBe(13);
        expect(result.body.result.user.id).toBe(existingUser.id);
        expect(result.body.result.content).toBe(feedInfo.content);
      });
    });
  });
});
