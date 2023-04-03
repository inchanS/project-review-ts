import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { Comment } from '../../entities/comment.entity';
import { Feed } from '../../entities/feed.entity';

describe('users.service API test', () => {
  let app: any = createApp();

  beforeAll(async () => {
    // dataSource 연결
    await dataSource.initialize().then(() => {
      if (process.env.NODE_ENV === 'test') {
        console.log('💥TEST Data Source has been initialized!');
      }
    });

    await dataSource.manager.query(`
        INSERT INTO feed_status (id, is_status)
        VALUES (1, 'published'),
               (2, 'temporary'),
               (3, 'deleted');
    `);

    await dataSource.manager.query(`
        INSERT INTO estimation (id, estimation)
        VALUES (1, 'double like'),
               (2, 'like'),
               (3, 'dislike');
    `);

    await dataSource.manager.query(`
        INSERT INTO symbol (id, symbol)
        VALUES (1, 'like'),
               (2, 'I have this too');
    `);

    await dataSource.manager.query(`
        INSERT INTO categories(id, category)
        VALUES (1, '1 Category'),
               (2, '2 Category'),
               (3, '3 Category'),
               (4, '4 Category'),
               (5, '5 Category');
    `);
  });

  afterAll(async () => {
    // dataSource table 초기화
    await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
    await dataSource.manager.query(`TRUNCATE TABLE feed_status;`);
    await dataSource.manager.query(`TRUNCATE TABLE estimation;`);
    await dataSource.manager.query(`TRUNCATE TABLE symbol;`);
    await dataSource.manager.query('TRUNCATE TABLE feed_symbol;');
    await dataSource.manager.query(`TRUNCATE TABLE categories;`);
    await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);

    // dataSource 연결 해제
    await dataSource.destroy().then(() => {
      console.log('💥TEST Data Source has been destroyed!');
    });
  });

  describe('checkDuplicateNickname', () => {
    beforeAll(async () => {
      // 이미 존재하는 유저 생성
      const existUser = new User();
      existUser.nickname = 'existedNickname';
      existUser.email = 'existedEmail@email.com';
      existUser.password = 'existedPassword@1234';
      await dataSource.manager.save(User, existUser);
    });

    afterAll(async () => {
      // 생성된 유저 삭제
      // 1. FK 제약조건을 제거
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      // 2. 테이블 삭제
      await dataSource.manager.clear(User);
      // 3. FK 제약조건을 다시 설정
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('checkDuplicateNickname - !nickname', async () => {
      const result = await request(app).get(`/users/checknickname?nickname=`);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('NICKNAME_IS_UNDEFINED');
    });

    test('checkDuplicateNickname - !checkData', async () => {
      const result = await request(app).get(
        `/users/checknickname?nickname=existedNickname`
      );

      expect(result.status).toBe(409);
      expect(result.body.message).toBe(
        'existedNickname_IS_NICKNAME_THAT_ALREADY_EXSITS'
      );
    });

    test('checkDuplicateNickname - success', async () => {
      const result = await request(app).get(
        `/users/checknickname?nickname=successNickname`
      );

      expect(result.status).toBe(200);
      expect(result.body.message).toBe('AVAILABLE_NICKNAME');
    });
  });

  describe('checkDuplicateEmail', () => {
    // 이미 존재하는 유저
    const existUser = new User();
    existUser.nickname = 'existedNickname';
    existUser.email = 'existedEmail@email.com';
    existUser.password = 'existedPassword@1234';

    beforeAll(async () => {
      // 이미 존재하는 유저 생성
      await dataSource.manager.save(User, existUser);
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('checkDuplicateEmail - !email', async () => {
      const result = await request(app).get(`/users/checkemail?email=`);

      expect(result.status).toBe(400);
      expect(result.body.message).toBe('EMAIL_IS_UNDEFINED');
    });

    test('checkDuplicateEmail - !checkData', async () => {
      const result = await request(app).get(
        `/users/checkemail?email=${existUser.email}`
      );

      expect(result.status).toBe(409);
      expect(result.body.message).toBe(
        `${existUser.email}_IS_EMAIL_THAT_ALREADY_EXSITS`
      );
    });

    test('checkDuplicateEmail - success', async () => {
      const newEmail = 'newEmail@email.com';

      const result = await request(app).get(
        `/users/checkemail?email=${newEmail}`
      );

      expect(result.status).toBe(200);
      expect(result.body.message).toBe('AVAILABLE_EMAIL');
    });
  });

  describe('signup', () => {
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
      const newUser = {
        nickname: 'newNickname',
        email: 'newEmail@email.com',
        password: 'newPassword@1234',
      };

      await request(app).post(`/users/signup`).send(newUser).expect(201);
    });
  });

  describe('signin', () => {
    const existUser = new User();
    existUser.nickname = 'existedNickname';
    existUser.email = 'existedEmail@email.com';
    existUser.password = 'existedPassword@1234';

    beforeAll(async () => {
      // 이미 존재하는 유저 생성 (토큰 생성을 위해 API 이용)
      await request(app).post(`/users/signup`).send(existUser);
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('signin - not found email', async () => {
      const newUser = {
        email: 'email',
        password: 'password',
      };

      await request(app)
        .post(`/users/signin`)
        .send(newUser)
        .expect(404)
        .expect({ message: `${newUser.email}_IS_NOT_FOUND` });
    });

    test('signin - wrong password', async () => {
      const newUser = {
        email: existUser.email,
        password: 'password',
      };

      await request(app)
        .post(`/users/signin`)
        .send(newUser)
        .expect(401)
        .expect({ message: 'PASSWORD_IS_INCORRECT' });
    });

    test('signin - success', async () => {
      const newUser = {
        email: existUser.email,
        password: existUser.password,
      };

      const result = await request(app).post(`/users/signin`).send(newUser);

      expect(result.status).toBe(200);
      expect(result.body.message).toEqual('SIGNIN_SUCCESS');
      expect(result.body.result).toHaveProperty('token');
    });
  });

  describe('getMyInfo', () => {
    const existUser = new User();
    existUser.id = 1;
    existUser.nickname = 'existedNickname';
    existUser.email = 'existedEmail@email.com';
    existUser.password = 'existedPassword@1234';

    beforeAll(async () => {
      // 이미 존재하는 유저 생성
      await request(app).post(`/users/signup`).send(existUser);

      const userFeed: any = new Feed();
      userFeed.id = 1;
      userFeed.title = 'userFeed';
      userFeed.content = 'userFeed';
      userFeed.user = existUser.id;
      userFeed.status = 1;
      userFeed.category = 1;
      userFeed.estimation = 1;
      userFeed.created_at = new Date();
      userFeed.updated_at = new Date();
      userFeed.deleted_at = null;
      userFeed.postedAt = new Date();

      await dataSource.manager.save(Feed, userFeed);

      const userPublicComment: any = new Comment();
      userPublicComment.comment = 'userComment';
      userPublicComment.user = existUser.id;
      userPublicComment.feed = userFeed.id;
      userPublicComment.is_private = false;
      userPublicComment.created_at = new Date();
      userPublicComment.updated_at = new Date();
      userPublicComment.deleted_at = null;

      const userPrivateComment: any = new Comment();
      userPrivateComment.comment = 'userComment';
      userPrivateComment.user = existUser.id;
      userPrivateComment.feed = userFeed.id;
      userPrivateComment.is_private = true;
      userPrivateComment.created_at = new Date();
      userPrivateComment.updated_at = new Date();
      userPrivateComment.deleted_at = null;

      const userDeletedComment: any = new Comment();
      userDeletedComment.comment = 'userComment';
      userDeletedComment.user = existUser.id;
      userDeletedComment.feed = userFeed.id;
      userDeletedComment.is_private = false;
      userDeletedComment.created_at = new Date();
      userDeletedComment.updated_at = new Date();
      userDeletedComment.deleted_at = new Date();

      const otherUser = new User();
      otherUser.id = 2;
      otherUser.nickname = 'otherNickname';
      otherUser.email = 'otherEmail';
      otherUser.password = 'otherPassword@1234';
      await dataSource.manager.save(User, otherUser);

      await dataSource.manager.save(Comment, [
        userPublicComment,
        userPrivateComment,
        userDeletedComment,
      ]);
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.clear(Feed);
      await dataSource.manager.clear(Comment);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('getMyInfo - success', async () => {
      const newUser = {
        email: existUser.email,
        password: existUser.password,
      };

      const signInResult = await request(app)
        .post(`/users/signin`)
        .send(newUser);

      const result = await request(app)
        .get(`/users/userinfo`)
        .set('Authorization', `Bearer ${signInResult.body.result.token}`);

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      expect(result.body).toHaveProperty('userInfo');
      expect(result.body).toHaveProperty('userFeeds');
      expect(result.body).toHaveProperty('userComments');

      // 사용자의 public comment, private comment, deleted comment 3개가 나와야 함
      expect(Object.keys(result.body.userComments)).toHaveLength(3);

      expect(result.body.userComments[0].comment).toEqual('userComment');
      expect(result.body.userComments[1].comment).toEqual('userComment');
      expect(result.body.userComments[2].comment).toEqual(
        '## DELETED_COMMENT ##'
      );
    });
  });
});
