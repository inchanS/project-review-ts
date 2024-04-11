import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { Response } from 'superagent';
import { UserDto } from '../../entities/dto/user.dto';
import { Feed } from '../../entities/feed.entity';
import { Comment } from '../../entities/comment.entity';
import { MakeTestClass } from './testUtils/makeTestClass';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { Express } from 'express';
import { TestUserFactory } from './testUtils/testUserFactory';
import { TestUtils } from './testUtils/testUtils';
import { ApiRequestHelper } from './testUtils/apiRequestHelper';
import { UploadFiles } from '../../entities/uploadFiles.entity';

// AWS SDK의 S3 서비스 부분을 모의 처리합니다.
jest.mock('@aws-sdk/client-s3', () => {
  class MockDeleteObjectsCommand {
    constructor() {}
  }

  // S3Client 모의 처리
  const mockS3Client = {
    send: jest.fn(async command => {
      if (command instanceof MockDeleteObjectsCommand) {
        // 명령에 따라 적절한 응답을 반환합니다.
        return;
      }
      throw new Error('Unknown command');
    }),
  };

  return {
    S3Client: jest.fn(() => mockS3Client),
    DeleteObjectsCommand: MockDeleteObjectsCommand, // 클래스로 정의하여 instanceof 검사를 통과하게 한다.
  };
});

const app: Express = createApp();

describe('user API', () => {
  beforeAll(async () => {
    await dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'test') {
          console.log('💥TEST Data Source for User API has been initialized!');
        }
      })
      .catch(error => {
        console.log('Data Source for User API Initializing failed:', error);
      });
  });

  afterAll(async () => {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy().then(() => {
      console.log('💥TEST Data Source has been destroyed!');
    });
  });

  describe('user validator service API', () => {
    const existingUser: UserDto = new UserDto(
      'existingNickname',
      'existingPassword@1234',
      'existingEmail@email.com'
    );

    const newUser: UserDto = new UserDto(
      'newNickname',
      'newPassword@1234',
      'newEmail@email.com'
    );

    beforeAll(async () => {
      // 이미 존재하는 유저 생성
      await dataSource.manager.save(User, {
        nickname: existingUser.nickname,
        password: existingUser.password,
        email: existingUser.email,
      });
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });
    describe('user validator service API - checkDuplicateNickname', () => {
      const endpoint: string = `/users/checknickname?nickname=`;
      test('checkDuplicateNickname - !nickname', async () => {
        await request(app)
          .get(endpoint)
          .expect(400, { message: 'NICKNAME_IS_REQUIRED' });
      });

      test('checkDuplicateNickname - !checkData', async () => {
        await request(app)
          .get(endpoint + existingUser.nickname)
          .expect(409, { message: `${existingUser.nickname}_ALREADY_EXISTS` });
      });

      test('checkDuplicateNickname - success', async () => {
        await request(app)
          .get(endpoint + newUser.nickname)
          .expect(200, { message: 'AVAILABLE_NICKNAME' });
      });
    });

    describe('user validator service API - checkDuplicateEmail', () => {
      const endpoint: string = `/users/checkemail?email=`;
      test('checkDuplicateEmail - !email', async () => {
        await request(app)
          .get(endpoint)
          .expect(400, { message: 'EMAIL_IS_REQUIRED' });
      });

      test('checkDuplicateEmail - !checkData', async () => {
        await request(app)
          .get(endpoint + existingUser.email)
          .expect(409, { message: `${existingUser.email}_ALREADY_EXISTS` });
      });

      test('checkDuplicateEmail - success', async () => {
        await request(app)
          .get(endpoint + newUser.email)
          .expect(200, { message: 'AVAILABLE_EMAIL' });
      });
    });
  });

  describe('user auth service API - signup', () => {
    afterAll(async () => {
      // 생성된 유저 삭제
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('signup - validation error', async () => {
      const validateErrorUser: UserDto = {
        nickname: 'nickname',
        email: 'email',
        password: 'password',
      };

      await request(app)
        .post(`/users/signup`)
        .send(validateErrorUser)
        .expect(500);
    });

    test('signup - success', async () => {
      const newUser: UserDto = new UserDto(
        'newNickname',
        'newPassword@1234',
        'newEmail@email.com'
      );

      await request(app).post(`/users/signup`).send(newUser).expect(201);
    });
  });

  describe('user auth service API - signin', () => {
    const existingUser: TestUserInfo = {
      id: 1,
      nickname: 'existingNickname',
      password: 'existingPassword@1234',
      email: 'existingEmail@email.com',
    };

    const existingUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(existingUser);

    beforeAll(async () => {
      // 이미 존재하는 유저 생성 (토큰 생성을 위해 API 이용)
      await dataSource.manager.save(User, existingUserEntity);
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('signin - not found email', async () => {
      const nonExistingUserLoginInfo: TestSignIn = {
        email: 'email',
        password: 'password',
      };

      await request(app)
        .post(`/users/signin`)
        .send(nonExistingUserLoginInfo)
        .expect(404, {
          message: `${nonExistingUserLoginInfo.email}_IS_NOT_FOUND`,
        });
    });

    test('signin - wrong password', async () => {
      const wrongPasswordLoginInfo: TestSignIn = {
        email: existingUser.email,
        password: 'wrong_password',
      };

      await request(app)
        .post(`/users/signin`)
        .send(wrongPasswordLoginInfo)
        .expect(401)
        .expect({ message: 'PASSWORD_IS_INCORRECT' });
    });

    test('signin - success', async () => {
      const existingUserLoginInfo: TestSignIn = {
        email: existingUser.email,
        password: existingUser.password,
      };

      const result: Response = await request(app)
        .post(`/users/signin`)
        .send(existingUserLoginInfo);

      expect(result.status).toBe(200);
      expect(result.body.message).toEqual('SIGNIN_SUCCESS');
      expect(result.body.result).toHaveProperty('token');
    });
  });

  describe('user info - 로그인 사용자의 정보 조회', () => {
    const endpoint: string = '/users/userinfo';

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

    const otherUser: TestUserInfo = {
      id: 2,
      nickname: 'otherUserNickname',
      email: 'otherUser@email.com',
      password: 'otherUserPassword@1234',
    };
    const otherUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(otherUser);

    const tempUser: TestUserInfo = {
      id: 3,
      nickname: 'tempNickname',
      email: 'tempEmail@email.com',
      password: 'tempPassword@1234',
    };
    const tempUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(tempUser);

    // test feeds
    const existingUserFeeds: Feed[] = [
      new MakeTestClass(1, existingUser.id).feedData(),
      new MakeTestClass(2, existingUser.id).feedData(),
      new MakeTestClass(3, existingUser.id).feedData(),
    ];

    const otherUserFeeds: Feed[] = [
      new MakeTestClass(4, otherUser.id).feedData(),
    ];

    const testFeeds: Feed[] = TestUtils.sortedMergedById(
      existingUserFeeds,
      otherUserFeeds
    );

    //test comments
    const existingUserComments: Comment[] = [
      new MakeTestClass(1, existingUser.id).commentData(4, false), // 공개 댓글
      new MakeTestClass(2, existingUser.id).commentData(4, true), // 비공개 댓글
      new MakeTestClass(3, existingUser.id).commentData(4, false, 1), // 공개 대댓글
      new MakeTestClass(5, existingUser.id).commentData(1, true, 4), // 비공개 대댓글
      new MakeTestClass(6, existingUser.id).commentData(
        1,
        false,
        undefined,
        true
      ), // 삭제한 공개댓글
    ];

    const otherUserComments: Comment[] = [
      new MakeTestClass(4, otherUser.id).commentData(1, true),
    ];
    const testComments: Comment[] = TestUtils.sortedMergedById(
      existingUserComments,
      otherUserComments
    );

    // test feed symbols
    const existingUserFeedSybols: FeedSymbol[] = [
      new MakeTestClass(1, existingUser.id).feedSymbolData(4, 1),
    ];
    const otherUserFeedSybols: FeedSymbol[] = [
      new MakeTestClass(2, otherUser.id).feedSymbolData(1, 1),
    ];
    const testFeedSymbols: FeedSymbol[] = TestUtils.sortedMergedById(
      existingUserFeedSybols,
      otherUserFeedSybols
    );

    beforeAll(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        // 이미 존재하는 유저 생성
        await transactionalEntityManager.save(User, [
          existingUserEntity,
          otherUserEntity,
          tempUserEntity,
        ]);
        await transactionalEntityManager.save(Feed, testFeeds);
        await transactionalEntityManager.save(Comment, testComments);
        await transactionalEntityManager.save(FeedSymbol, testFeedSymbols);
      });
    });

    afterAll(async () => {
      await TestUtils.clearDatabaseTables(dataSource);
    });

    test('user info - api query에 user id가 없으면서, 로그인도 되어있지 않을 때', async () => {
      await request(app)
        .get(endpoint)
        .expect(400, { message: 'USER_ID_IS_REQUIRED' });
    });

    test('user Content - getMyInfo - 로그인 후, 탈퇴한 경우', async () => {
      // 로그인 후, 토큰 발급
      const tempUserSigningInfo: TestSignIn =
        TestUserFactory.createSignInInfo(tempUser);
      const token: string = await ApiRequestHelper.getAuthToken(
        app,
        tempUserSigningInfo
      );

      // 인위적으로 DB에서 회원정보에 탈퇴정보를 추가하여 탈퇴회원으로 수정
      await dataSource.manager.update(
        User,
        { id: tempUser.id },
        {
          deleted_at: new Date(),
        }
      );

      // 탈퇴 전 발급받은 토큰으로 정보조회 요청
      await request(app)
        .get(endpoint)
        .set('Authorization', token)
        .expect(404, { message: 'NOT_FOUND_USER' });
    });

    test('user Content - getMyInfo: success', async () => {
      const result: Response = await ApiRequestHelper.makeAuthGetRequest(
        app,
        existingUserSigningInfo,
        endpoint
      );
      TestUtils.validateUser(result, existingUser);
    });

    test('user Content - otherUser info: success ', async () => {
      const result: Response = await request(app).get(
        `${endpoint}/${otherUser.id}`
      );

      TestUtils.validateUser(result, otherUser);
    });

    test('user Content - no user: fail', async () => {
      const noUserId: string = '10000';
      await request(app)
        .get(`${endpoint}/${noUserId}`)
        .expect(404, { message: 'NOT_FOUND_USER' });
    });

    test('user Content - getMyFeedList - success', async () => {
      const result: Response = await ApiRequestHelper.makeAuthGetRequest(
        app,
        existingUser,
        `${endpoint}/feeds`
      );

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      expect(result.body.feedCntByUserId).toEqual(existingUserFeeds.length);
      expect(result.body.totalPage).toEqual(1);
      expect(result.body.feedListByUserId[0].userId).toEqual(existingUser.id);
      expect(result.body.feedListByUserId[0].title).toEqual('test title');
    });

    test('user Content - getMyCommentList - success', async () => {
      const result: Response = await ApiRequestHelper.makeAuthGetRequest(
        app,
        existingUser,
        `${endpoint}/comments`
      );

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      // 로그인 사용자의 총 덧글 개수
      expect(result.body.commentCntByUserId).toEqual(
        existingUserComments.length
      );
      // 로그인 사용자의 공개 덧글이 숨겨지지 않은지 확인
      expect(
        result.body.commentListByUserId.find((item: Comment) => item.id === 1)
          .comment
      ).toEqual(MakeTestClass.publicComment);

      // 사용자의 삭제한 덧글이 삭제된 내용으로 반환되는지 확인
      const deletedComments: Comment[] = result.body.commentListByUserId.filter(
        (item: Comment) => item.deleted_at !== null
      );
      const allCommentsAreDeleted: boolean = deletedComments.every(
        (item: Comment) => item.comment === MakeTestClass.deletedComment
      );
      expect(allCommentsAreDeleted).toBe(true);

      // 대댓글의 경우에도 정상적으로 내용을 반환하는지 확인
      const childComments: Comment[] = result.body.commentListByUserId.filter(
        (item: Comment) => item.parent
      );
      const allCommentsHaveParent: Boolean = childComments.every(
        (item: Comment) => item.comment === MakeTestClass.publicComment
      );
      expect(allCommentsHaveParent).toBe(true);

      // 로그인 사용자의 비공개 덧글이 숨겨지지않고 제대로 반환되는지 확인
      const privateComments: Comment[] = result.body.commentListByUserId.filter(
        (item: Comment) => item.is_private
      );
      const allPrivatedComments: boolean = privateComments.every(
        (item: Comment) => item.comment === MakeTestClass.publicComment
      );
      expect(allPrivatedComments).toBe(true);
    });
    //
    test('user Content - getMyFeedSymbolList - success', async () => {
      const result: Response = await ApiRequestHelper.makeAuthGetRequest(
        app,
        existingUser,
        `${endpoint}/symbols`
      );

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      expect(result.body.symbolCntByUserId).toEqual(
        existingUserFeedSybols.length
      );
      expect(result.body.symbolCntByUserId).toEqual(1);

      expect(result.body.symbolListByUserId[0].feed.id).toEqual(4);
      expect(result.body.symbolListByUserId[0].symbol.id).toEqual(1);
      expect(result.body.symbolListByUserId[0].symbol.symbol).toEqual('like');
    });
  });

  describe('user info - 사용자 정보 변경', () => {
    const endpoint: string = '/users/signup';

    // 기존 사용자 정보
    const existingUser: TestUserInfo = {
      id: 1,
      nickname: 'existingNickname',
      password: 'existingPassword@1234',
      email: 'existingEmail@email.com',
    };

    const existingUserSignIn: TestSignIn =
      TestUserFactory.createSignInInfo(existingUser);
    const existingUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(existingUser);

    // 기존 사용자의 정보를 변경하거나 삭제하는 테스트들이기에 beforeAll이 아닌 beforeEach로 처리
    beforeEach(async () => {
      // 이미 존재하는 유저 생성 (토큰 생성을 위해 API 이용)
      await dataSource.manager.save(User, existingUserEntity);
    });

    afterEach(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('user info - 사용자정보변경: 실패(로그인 후 탈퇴 후 정보변경시 - not found user', async () => {
      const token: string = await ApiRequestHelper.getAuthToken(
        app,
        existingUserSignIn
      );

      await dataSource.manager.update(
        User,
        { id: existingUser.id },
        {
          deleted_at: new Date(),
        }
      );

      const updateUserInfo: { email: string } = {
        email: 'updateUserInfo@email.com',
      };

      await request(app)
        .patch(endpoint)
        .set('Authorization', token)
        .send(updateUserInfo)
        .expect(404, { message: 'NOT_FOUND_USER' });
    });

    test('user info - 사용자 정보변경: 실패 - no change', async () => {
      const updateSameUserInfo: { email: string; nickname: string } = {
        email: existingUser.email,
        nickname: existingUser.nickname,
      };

      const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
        app,
        existingUserSignIn,
        endpoint,
        updateSameUserInfo
      );

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('NO_CHANGE');
    });

    test.each([
      {
        email: 'updateEmail@email.com',
        nickname: existingUser.nickname,
      },
      {
        email: existingUser.email,
        nickname: 'updateNiname',
      },
    ])(
      'user info - 사용자 정보 변경(이메일, 닉네임): 성공',
      async (item: { email: string; nickname: string }) => {
        const result: Response = await ApiRequestHelper.makeAuthPatchRequest(
          app,
          existingUserSignIn,
          endpoint,
          item
        );

        expect(result.status).toBe(200);
        expect(result.body.message).toBe('UPDATE_USERINFO_SUCCESS');
        expect(Object.keys(result.body.result)).toHaveLength(6);
        expect(result.body.result).toHaveProperty('id', existingUser.id);
        expect(result.body.result).toHaveProperty('nickname', item.nickname);
        expect(result.body.result).toHaveProperty('email', item.email);
      }
    );

    test('user info - 사용자변경(password)', async () => {
      const newPassword: string = 'newPassword#1234';
      const updateUserInfo: { password: string } = { password: newPassword };

      await ApiRequestHelper.makeAuthPatchRequest(
        app,
        existingUserSignIn,
        endpoint,
        updateUserInfo
      );

      const newExistingUserSignIn: TestSignIn = {
        email: existingUser.email,
        password: newPassword,
      };
      const successResultModel: Response = await ApiRequestHelper.signinUser(
        app,
        newExistingUserSignIn
      );

      // 업데이트한 패스워드로 로그인시 성공
      expect(successResultModel.status).toBe(200);
      expect(successResultModel.body.message).toEqual('SIGNIN_SUCCESS');

      const failedResultModel: Response = await ApiRequestHelper.signinUser(
        app,
        existingUserSignIn
      );

      // 패스워드 업데이트 이후, 이전 패스워드로 로그인시 실패
      expect(failedResultModel.status).toBe(401);
      expect(failedResultModel.body.message).toEqual('PASSWORD_IS_INCORRECT');
    });
  });

  describe('delete user API', () => {
    const endpoint: string = '/users/signup';

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

    const otherUser: TestUserInfo = {
      id: 2,
      nickname: 'otherUserNickname',
      email: 'otherUser@email.com',
      password: 'otherUserPassword@1234',
    };
    const otherUserEntity: TestUserInfo =
      TestUserFactory.createUserEntity(otherUser);

    // test feeds
    const existingUserFeeds: Feed[] = [
      new MakeTestClass(1, existingUser.id).feedData(),
      new MakeTestClass(2, existingUser.id).feedData(),
      new MakeTestClass(3, existingUser.id).feedData(),
    ];

    const otherUserFeeds: Feed[] = [
      new MakeTestClass(4, otherUser.id).feedData(),
    ];

    const testFeeds: Feed[] = TestUtils.sortedMergedById(
      existingUserFeeds,
      otherUserFeeds
    );

    const existingUserUploadFiles: UploadFiles[] = [
      new MakeTestClass(1, existingUser.id).uploadData('image.jpg', 1),
      new MakeTestClass(2, existingUser.id).uploadData('image.txt', 1),
    ];

    //test comments
    const existingUserComments: Comment[] = [
      new MakeTestClass(1, existingUser.id).commentData(4, false), // 공개 댓글
      new MakeTestClass(2, existingUser.id).commentData(4, true), // 비공개 댓글
      new MakeTestClass(3, existingUser.id).commentData(4, false, 1), // 공개 대댓글
      new MakeTestClass(5, existingUser.id).commentData(1, true, 4), // 비공개 대댓글
      new MakeTestClass(6, existingUser.id).commentData(
        1,
        false,
        undefined,
        true
      ), // 삭제한 공개댓글
    ];

    const otherUserComments: Comment[] = [
      new MakeTestClass(4, otherUser.id).commentData(1, true),
    ];
    const testComments: Comment[] = TestUtils.sortedMergedById(
      existingUserComments,
      otherUserComments
    );

    // test feed symbols
    const existingUserFeedSybols: FeedSymbol[] = [
      new MakeTestClass(1, existingUser.id).feedSymbolData(4, 1),
    ];
    const otherUserFeedSybols: FeedSymbol[] = [
      new MakeTestClass(2, otherUser.id).feedSymbolData(1, 1),
    ];
    const testFeedSymbols: FeedSymbol[] = TestUtils.sortedMergedById(
      existingUserFeedSybols,
      otherUserFeedSybols
    );

    beforeEach(async () => {
      await dataSource.transaction(async transactionalEntityManager => {
        // 이미 존재하는 유저 생성
        await transactionalEntityManager.save(User, [
          existingUserEntity,
          otherUserEntity,
        ]);

        await transactionalEntityManager.save(Feed, testFeeds);
        await transactionalEntityManager.save(Comment, testComments);
        await transactionalEntityManager.save(FeedSymbol, testFeedSymbols);
        await transactionalEntityManager.save(
          UploadFiles,
          existingUserUploadFiles
        );
      });
    });

    afterEach(async () => {
      await TestUtils.clearDatabaseTables(dataSource);
    });

    test('delete User API - delete User: success', async () => {
      const result: Response = await ApiRequestHelper.makeAuthDeleteRequest(
        app,
        existingUserSigningInfo,
        endpoint
      );

      const feedsByDeletedUser: Feed[] = await dataSource.manager.find(Feed, {
        loadRelationIds: true,
        where: { user: { id: existingUser.id } },
      });

      const commentsByDeletedUser: Comment[] = await dataSource.manager.find(
        Comment,
        {
          loadRelationIds: true,
          where: { user: { id: existingUser.id } },
        }
      );

      const feedSymbolsByDeletedUser: FeedSymbol[] =
        await dataSource.manager.find(FeedSymbol, {
          loadRelationIds: true,
          where: { user: { id: existingUser.id } },
        });

      const uploadFilesByDeletedUser: UploadFiles[] =
        await dataSource.manager.find(UploadFiles, {
          loadRelationIds: true,
          where: { user: { id: existingUser.id } },
        });

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ message: 'DELETE_USER_SUCCESS' });
      expect(feedsByDeletedUser.length).toBe(0);
      expect(commentsByDeletedUser.length).toBe(0);
      expect(feedSymbolsByDeletedUser.length).toBe(0);
      expect(uploadFilesByDeletedUser.length).toBe(0);
    });
  });
});
