import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { Response } from 'superagent';
import { UserDto } from '../../entities/dto/user.dto';
import bcrypt from 'bcryptjs';
import { Feed } from '../../entities/feed.entity';
import { Comment } from '../../entities/comment.entity';
import { MakeTestClass } from '../testUtils/makeTestClass';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { Express } from 'express';
import { MakeTestUser } from '../testUtils/makeTestUser';
import { TestUtils } from '../testUtils/testUtils';

// 전체 auth API 테스트 설명
describe('users.auth API test', () => {
  let app: Express = createApp();

  beforeAll(async () => {
    // dataSource 연결
    await dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'test') {
          console.log('💥TEST Data Source has been initialized!');
        }
      })
      .catch(error => {
        console.log('Data Source Initializing failed:', error);
      });

    await dataSource
      .synchronize(true)
      .then(() => {
        console.log('💥TEST Data Source has been synchronized!');
      })
      .catch(error => {
        console.log('Data Source synchronizing failed:', error);
      });

    await dataSource
      .runMigrations()
      .then(() => {
        console.log('💥TEST Data Source has been runMigrations!');
      })
      .catch(error => {
        console.log('Migration sync failed:', error);
      });
  });

  afterAll(async () => {
    // dataSource table 초기화
    // 외래키 검사 비활성화
    await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`).then(() => {
      console.log('🔥user.api.test - SET FOREIGN_KEY_CHECKS = 0');
    });
    // 모든 일반 테이블명 가져오기
    const tables = await dataSource.manager.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'test_project_review'
            AND table_type = 'BASE TABLE';
      `);
    // 모든 일반 테이블 지우기
    for (const table of tables) {
      // dataSource.manager.clear(TABLE_NAME) 메소드는 migrations 테이블까지는 불러오지 못한다.
      await dataSource.manager.query(`TRUNCATE TABLE ${table.TABLE_NAME};`);
    }
    console.log('🔥user.api.test - TRUNCATED ALL TABLES');
    // 외래키 검사 재활성화
    await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`).then(() => {
      console.log('🔥user.api.test - SET FOREIGN_KEY_CHECKS = 1');
    });

    // dataSource 연결 해제
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
      test('checkDuplicateNickname - !nickname', async () => {
        await request(app)
          .get(`/users/checknickname?nickname=`)
          .expect(400, { message: 'NICKNAME_IS_REQUIRED' });
      });

      test('checkDuplicateNickname - !checkData', async () => {
        await request(app)
          .get(`/users/checknickname?nickname=${existingUser.nickname}`)
          .expect(409, { message: `${existingUser.nickname}_ALREADY_EXISTS` });
      });

      test('checkDuplicateNickname - success', async () => {
        await request(app)
          .get(`/users/checknickname?nickname=${newUser.nickname}`)
          .expect(200, { message: 'AVAILABLE_NICKNAME' });
      });
    });

    describe('user validator service API - checkDuplicateEmail', () => {
      test('checkDuplicateEmail - !email', async () => {
        await request(app)
          .get(`/users/checkemail?email=`)
          .expect(400, { message: 'EMAIL_IS_REQUIRED' });
      });

      test('checkDuplicateEmail - !checkData', async () => {
        await request(app)
          .get(`/users/checkemail?email=${existingUser.email}`)
          .expect(409, { message: `${existingUser.email}_ALREADY_EXISTS` });
      });

      test('checkDuplicateEmail - success', async () => {
        await request(app)
          .get(`/users/checkemail?email=${newUser.email}`)
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

    const hashingPassword: string = bcrypt.hashSync(
      existingUser.password,
      bcrypt.genSaltSync()
    );

    beforeAll(async () => {
      // 이미 존재하는 유저 생성 (토큰 생성을 위해 API 이용)
      await dataSource.manager.save(User, {
        id: existingUser.id,
        nickname: existingUser.nickname,
        password: hashingPassword,
        email: existingUser.email,
      });
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
    // test users
    const existingUser: TestUserInfo = {
      id: 1,
      nickname: 'existingNickname',
      password: 'existingPassword@1234',
      email: 'existingEmail@email.com',
    };

    const existingUserEntity: TestUserInfo =
      MakeTestUser.userEntityInfo(existingUser);

    const otherUser: TestUserInfo = {
      id: 2,
      nickname: 'otherUserNickname',
      email: 'otherUser@email.com',
      password: 'otherUserPassword@1234',
    };
    const otherUserEntity: TestUserInfo =
      MakeTestUser.userEntityInfo(otherUser);

    const tempUser: TestUserInfo = {
      id: 3,
      nickname: 'tempNickname',
      email: 'tempEmail@email.com',
      password: 'tempPassword@1234',
    };
    const tempUserEntity: TestUserInfo = MakeTestUser.userEntityInfo(tempUser);

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
      new MakeTestClass(1, existingUser.id).feedSymbolData(4),
    ];
    const otherUserFeedSybols: FeedSymbol[] = [
      new MakeTestClass(2, otherUser.id).feedSymbolData(1),
    ];
    const testFeedSymbols: FeedSymbol[] = TestUtils.sortedMergedById(
      existingUserFeedSybols,
      otherUserFeedSybols
    );

    beforeAll(async () => {
      // 이미 존재하는 유저 생성
      await dataSource.manager.save(User, [
        existingUserEntity,
        otherUserEntity,
        tempUserEntity,
      ]);
      await dataSource.manager.save(Feed, testFeeds);
      await dataSource.manager.save(Comment, testComments);
      await dataSource.manager.save(FeedSymbol, testFeedSymbols);
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.clear(Feed);
      await dataSource.manager.clear(Comment);
      await dataSource.manager.clear(FeedSymbol);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('user info - api query에 user id가 없으면서, 로그인도 되어있지 않을 때', async () => {
      await request(app)
        .get('/users/userinfo')
        .expect(400, { message: 'USER_ID_IS_REQUIRED' });
    });

    test('user Content - getMyInfo - 로그인 후, 탈퇴한 경우', async () => {
      // 로그인 후, 토큰 발급
      const tempUserSigningInfo: TestSignIn =
        MakeTestUser.signingInfo(tempUser);
      const authResponse: Response = await MakeTestUser.signinUser(
        app,
        tempUserSigningInfo
      );
      const token = authResponse.body.result.token;

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
        .get('/users/userinfo')
        .set('Authorization', token)
        .expect(404, { message: 'NOT_FOUND_USER' });
    });

    test('user Content - getMyInfo: success', async () => {
      const existingUserSigningInfo: TestSignIn =
        MakeTestUser.signingInfo(existingUser);
      const result: Response = await MakeTestUser.makeAuthGetRequest(
        app,
        existingUserSigningInfo,
        `/users/userinfo`
      );
      TestUtils.validateUser(result, existingUser);
    });

    test('user Content - otherUser info: success ', async () => {
      const result: Response = await request(app).get(
        `/users/userinfo/${otherUser.id}`
      );

      TestUtils.validateUser(result, otherUser);
    });

    test('user Content - no user: fail', async () => {
      const noUserId: string = '10000';
      await request(app)
        .get(`/users/userinfo/${noUserId}`)
        .expect(404, { message: 'NOT_FOUND_USER' });
    });

    test('user Content - getMyFeedList - success', async () => {
      const result: Response = await MakeTestUser.makeAuthGetRequest(
        app,
        existingUser,
        `/users/userinfo/feeds`
      );

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      expect(result.body.feedCntByUserId).toEqual(existingUserFeeds.length);
      expect(result.body.totalPage).toEqual(1);
      expect(result.body.feedListByUserId[0].userId).toEqual(existingUser.id);
      expect(result.body.feedListByUserId[0].title).toEqual('test title');
    });

    test('user Content - getMyCommentList - success', async () => {
      const result: Response = await MakeTestUser.makeAuthGetRequest(
        app,
        existingUser,
        `/users/userinfo/comments`
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
      const result: Response = await MakeTestUser.makeAuthGetRequest(
        app,
        existingUser,
        `/users/userinfo/symbols`
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

  describe('user info - 사용자 정보변경', () => {
    // 기존 사용자 정보
    const existingUser: TestUserInfo = {
      id: 1,
      nickname: 'existingNickname',
      password: 'existingPassword@1234',
      email: 'existingEmail@email.com',
    };

    const existingUserSignIn: TestSignIn =
      MakeTestUser.signingInfo(existingUser);
    const existingUserEntity: TestUserInfo =
      MakeTestUser.userEntityInfo(existingUser);

    beforeEach(async () => {
      // 이미 존재하는 유저 생성 (토큰 생성을 위해 API 이용)
      await dataSource.manager.save(User, existingUserEntity);
    });

    afterEach(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('user info - 사용자정보변경: 실패 - not found user', async () => {
      const authResponse = await MakeTestUser.signinUser(
        app,
        existingUserSignIn
      );
      const token = authResponse.body.result.token;

      await dataSource.manager.update(
        User,
        { id: existingUser.id },
        {
          deleted_at: new Date(),
        }
      );

      const updateUserInfo = {
        email: 'updateUserInfo@email.com',
      };

      const endpoint: string = '/users/signup';

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

      const endpoint: string = '/users/signup';

      const result: Response = await MakeTestUser.makeAuthPostOrPatchRequest(
        app,
        existingUserSignIn,
        endpoint,
        'patch',
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
      'user info - 사용자 정보 변경: 성공',
      async (item: { email: string; nickname: string }) => {
        const endpoint: string = '/users/signup';

        const result: Response = await MakeTestUser.makeAuthPostOrPatchRequest(
          app,
          existingUserSignIn,
          endpoint,
          'patch',
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
  });
});
