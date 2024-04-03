import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { UserDto } from '../../entities/dto/user.dto';
import bcrypt from 'bcryptjs';

// 전체 auth API 테스트 설명
describe('users.auth API test', () => {
  let app: any = createApp();

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
        console.log('Migration sync failed:', error);
      });

    await dataSource
      .synchronize(true)
      .then(() => {
        console.log('💥TEST Data Source has been synchronized!');
      })
      .catch(error => {
        console.log('Migration sync failed:', error);
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
      await dataSource.manager.query(`TRUNCATE TABLE ${table.TABLE_NAME};`);

      // dataSource.manager.clear(TABLE_NAME) 메소드는 migrations 테이블은 불러오지 못한다.
      // await dataSource.manager.clear(table.TABLE_NAME).then(() => {
      //   console.log(`🔥user.api.test - CLEAR TABLES ${table.TABLE_NAME}`);
      // });
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
      const validateErrorUser = {
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
    const existingUser = {
      id: 1,
      nickname: 'existingNickname',
      password: 'existingPassword@1234',
      email: 'existingEmail@email.com',
    };

    const hashingPassword = bcrypt.hashSync(
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
      const nonExistingUserLoginInfo = {
        email: 'email',
        password: 'password',
      };

      await request(app)
        .post(`/users/signin`)
        .send(nonExistingUserLoginInfo)
        .expect(404)
        .expect({ message: `${nonExistingUserLoginInfo.email}_IS_NOT_FOUND` });
    });

    test('signin - wrong password', async () => {
      const wrongPasswordLoginInfo = {
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
      const existingUserLoginInfo = {
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
});
