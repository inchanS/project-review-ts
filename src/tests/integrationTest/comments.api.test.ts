import dataSource from '../../repositories/data-source';
import { TestUtils } from './testUtils/testUtils';
import { TestSignIn, TestUserInfo } from '../../types/test';
import { TestUserFactory } from './testUtils/testUserFactory';
import { Feed } from '../../entities/feed.entity';
import { MakeTestClass } from './testUtils/makeTestClass';
import { User } from '../../entities/users.entity';
import { ApiRequestHelper } from './testUtils/apiRequestHelper';
import { Response } from 'superagent';
import { TestInitializer } from './testUtils/testInitializer';

TestInitializer.initialize('Comments CRUD API Test', () => {
  describe('setup Comments CRUD API test', () => {
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

    const otherUser1: TestUserInfo = {
      id: 2,
      nickname: 'otherNickname1',
      password: 'otherUserPassword@1234',
      email: 'otherUser1@email.com',
    };
    const otherUser1Entity: TestUserInfo =
      TestUserFactory.createUserEntity(otherUser1);
    // const otherUser1SigningInfo: TestSignIn =
    //   TestUserFactory.createSignInInfo(otherUser1);

    const otherUser2: TestUserInfo = {
      id: 3,
      nickname: 'otherUserNickname2',
      password: 'otherUserPassword@1234',
      email: 'otherUser2@email.com',
    };
    const otherUser2Entity: TestUserInfo =
      TestUserFactory.createUserEntity(otherUser2);
    // const otherUser2SigningInfo: TestSignIn =
    //   TestUserFactory.createSignInInfo(otherUser2);

    // test feeds
    const existingUsersFeed: Feed = new MakeTestClass(existingUser.id).feedData(
      1
    );
    const otherUser1sFeed: Feed = new MakeTestClass(otherUser1.id).feedData(2);

    // set DB
    const testUserEntities: TestUserInfo[] = [
      existingUserEntity,
      otherUser1Entity,
      otherUser2Entity,
    ];

    const testFeeds: Feed[] = [existingUsersFeed, otherUser1sFeed];

    let token: string;
    beforeEach(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.save(User, testUserEntities);
        await transactionalEntityManager.save(Feed, testFeeds);
      });
      token = await ApiRequestHelper.getAuthToken(existingUserSigningInfo);
    });

    afterEach(async () => {
      await TestUtils.clearDatabaseTables(dataSource);
    });

    describe('create a comment test', () => {
      const endpoint: string = '/comments';
      const successStatusCode: number = 201;
      const successMessage: string =
        'THIS_COMMENT_HAS_BEEN_SUCCESSFULLY_CREATED';

      test('create a public comment test', async () => {
        const comment = {
          feed: otherUser1sFeed.id,
          comment: ' 댓글입니다.',
          is_private: false,
        };

        const result: Response = await ApiRequestHelper.makeAuthPostRequest(
          token,
          endpoint,
          comment
        );
        const resultBody = result.body.result;

        expect(result.status).toBe(successStatusCode);
        expect(result.body.message).toBe(successMessage);
        expect(resultBody.comment).toBe(comment.comment);
        expect(resultBody.is_private).toBe(false);
      });
    });
  });
});
