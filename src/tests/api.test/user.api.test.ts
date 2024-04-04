import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { UserDto } from '../../entities/dto/user.dto';
import bcrypt from 'bcryptjs';
import { Feed } from '../../entities/feed.entity';
import { Comment } from '../../entities/comment.entity';
import { MakeTestClass } from '../testUtils/makeTestClass';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { Express } from 'express';
import { MakeTestUser } from '../testUtils/makeTestUser';

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
        const result = await request(app).get(`/users/checknickname?nickname=`);

        expect(result.status).toBe(400);
        expect(result.body.message).toBe('NICKNAME_IS_REQUIRED');
      });

      test('checkDuplicateNickname - !checkData', async () => {
        const result = await request(app).get(
          `/users/checknickname?nickname=${existingUser.nickname}`
        );

        expect(result.status).toBe(409);
        expect(result.body.message).toBe(
          `${existingUser.nickname}_ALREADY_EXISTS`
        );
      });

      test('checkDuplicateNickname - success', async () => {
        const result = await request(app).get(
          `/users/checknickname?nickname=${newUser.nickname}`
        );

        expect(result.status).toBe(200);
        expect(result.body.message).toBe('AVAILABLE_NICKNAME');
      });
    });

    describe('user validator service API - checkDuplicateEmail', () => {
      test('checkDuplicateEmail - !email', async () => {
        const result = await request(app).get(`/users/checkemail?email=`);

        expect(result.status).toBe(400);
        expect(result.body.message).toBe('EMAIL_IS_REQUIRED');
      });

      test('checkDuplicateEmail - !checkData', async () => {
        const result = await request(app).get(
          `/users/checkemail?email=${existingUser.email}`
        );

        expect(result.status).toBe(409);
        expect(result.body.message).toBe(
          `${existingUser.email}_ALREADY_EXISTS`
        );
      });

      test('checkDuplicateEmail - success', async () => {
        const result = await request(app).get(
          `/users/checkemail?email=${newUser.email}`
        );

        expect(result.status).toBe(200);
        expect(result.body.message).toBe('AVAILABLE_EMAIL');
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
        .expect(404)
        .expect({
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

      const result = await request(app)
        .post(`/users/signin`)
        .send(existingUserLoginInfo);

      expect(result.status).toBe(200);
      expect(result.body.message).toEqual('SIGNIN_SUCCESS');
      expect(result.body.result).toHaveProperty('token');
    });
  });

  describe('user info - 로그인 사용자의 정보 조회', () => {
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

    beforeAll(async () => {
      // 이미 존재하는 유저 생성

      await dataSource.manager.save(User, [
        existingUserEntity,
        otherUserEntity,
        tempUserEntity,
      ]);

      const testFeeds: Feed[] = [
        new MakeTestClass(1, existingUser.id).feedData(),
        new MakeTestClass(2, existingUser.id).feedData(),
        new MakeTestClass(3, existingUser.id).feedData(),
        new MakeTestClass(4, otherUser.id).feedData(),
      ];
      await dataSource.manager.save(Feed, testFeeds);

      const testComments: Comment[] = [
        new MakeTestClass(1, existingUser.id).commentData(4, false),
        new MakeTestClass(2, existingUser.id).commentData(4, true),
        new MakeTestClass(3, existingUser.id).commentData(4, false, 1),
        new MakeTestClass(4, otherUser.id).commentData(1, true),
        new MakeTestClass(5, existingUser.id).commentData(1, true, 4),
      ];
      await dataSource.manager.save(Comment, testComments);

      const testFeedSymbols: FeedSymbol[] = [
        new MakeTestClass(1, existingUser.id).feedSymbolData(4),
        new MakeTestClass(2, otherUser.id).feedSymbolData(1),
      ];
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
      const result = await request(app).get('/users/userinfo');

      expect(result.status).toBe(400);
      expect(result.body.message).toEqual('USER_ID_IS_REQUIRED');
    });

    test('user Content - getMyInfo - 로그인 후, 탈퇴한 경우', async () => {
      // 로그인 후, 토큰 발급
      const tempUserSigningInfo: TestSignIn =
        MakeTestUser.signingInfo(tempUser);
      const authResponse = await MakeTestUser.signinUser(
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
      const result = await request(app)
        .get('/users/userinfo')
        .set('Authorization', token);

      expect(result.status).toBe(404);
      expect(result.body.message).toEqual('NOT_FOUND_USER');
    });

    test('user Content - getMyInfo - success', async () => {
      const existingUserSigningInfo = MakeTestUser.signingInfo(existingUser);
      const result = await MakeTestUser.makeAuthRequest(
        app,
        existingUserSigningInfo,
        `/users/userinfo`
      );

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(6);
      expect(result.body.id).toEqual(existingUser.id);
      expect(result.body.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );
      expect(result.body.updated_at).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );
      expect(result.body.deleted_at).toEqual(null);
      expect(result.body.nickname).toEqual(existingUser.nickname);
      expect(result.body.email).toEqual(existingUser.email);
    });
  });
});
