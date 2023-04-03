import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { Comment } from '../../entities/comment.entity';
import { Feed } from '../../entities/feed.entity';

// 테스트간 피드생성을 위한 피드 클래스 생성

//       userTempFeed.id = 2;
//       userTempFeed.title = 'userTempFeed';
//       userTempFeed.content = 'userTempFeed';
//       userTempFeed.user = existUser.id;
//       userTempFeed.status = 0;
//       userTempFeed.category = 1;
//       userTempFeed.estimation = 1;
//       userTempFeed.created_at = new Date();
//       userTempFeed.updated_at = new Date();
//       userTempFeed.deleted_at = null;
//       userTempFeed.postedAt = null;
class FeedClass {
  id: number;
  title: string;
  content: string;
  user: number;
  status: number;
  category: number;
  estimation: number;
  postedAt: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  constructor(id: number, userId: number) {
    this.id = id;
    this.title = 'test title';
    this.content = 'test content';
    this.user = userId;
    this.status = 1;
    this.category = 1;
    this.estimation = 1;
    this.postedAt = new Date();
    this.created_at = new Date();
    this.updated_at = new Date();
    this.deleted_at = new Date();
  }
}

// 테스트간 댓글생성을 위한 댓글 클래스 생성
class CommentClass {
  id: number;
  comment: string;
  feed: number;
  user: number;
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  constructor(id: number, feedId: number, userId: number, is_private: boolean) {
    this.id = id;
    this.comment = 'test comment';
    this.feed = feedId;
    this.user = userId;
    this.is_private = is_private;
    this.created_at = new Date();
    this.updated_at = new Date();
    this.deleted_at = null;
  }
}

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

      const userFeed: any = new FeedClass(1, existUser.id);

      await dataSource.manager.save(Feed, userFeed);

      const userPublicComment: any = new CommentClass(
        1,
        userFeed.id,
        existUser.id,
        false
      );

      const userPrivateComment = new CommentClass(
        2,
        userFeed.id,
        existUser.id,
        true
      );

      const userDeletedComment = new CommentClass(
        3,
        userFeed.id,
        existUser.id,
        false
      );
      userDeletedComment.deleted_at = new Date();

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

    test('getMyInfo - invalid_token', async () => {
      const result = await request(app).get('/users/userinfo');

      expect(result.status).toBe(401);
      expect(result.body.message).toEqual('INVALID_TOKEN');
    });

    test('getMyInfo - not_found_user', async () => {
      // 로그인 후 막 탈퇴한 회원의 유효성 검사
      const deleteUser = new User();
      deleteUser.nickname = 'deleteNickname';
      deleteUser.email = 'deleteEmail@email.com';
      deleteUser.password = 'deletePassword@1234';
      await request(app).post(`/users/signup`).send(deleteUser);

      const signInResult = await request(app).post(`/users/signin`).send({
        email: deleteUser.email,
        password: deleteUser.password,
      });

      await dataSource.manager.update(
        User,
        { nickname: 'deleteNickname' },
        {
          deleted_at: new Date(),
        }
      );

      const result = await request(app)
        .get('/users/userinfo')
        .set('Authorization', `Bearer ${signInResult.body.result.token}`);

      expect(result.status).toBe(404);
      expect(result.body.message).toEqual('USER_IS_NOT_FOUND');
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

      console.log('🔥users.api.test/:400- result.body = ', result.body);

      expect(result.body.userComments[0].comment).toEqual('test comment');
      expect(result.body.userComments[1].comment).toEqual('test comment');
      expect(result.body.userComments[2].comment).toEqual(
        '## DELETED_COMMENT ##'
      );
    });
  });

  describe('getUserInfo', () => {
    const existUser = new User();
    existUser.id = 1;
    existUser.nickname = 'existedNickname';
    existUser.email = 'existedEmail@email.com';
    existUser.password = 'existedPassword@1234';

    beforeAll(async () => {
      await request(app).post(`/users/signup`).send(existUser);

      // 타겟유저의 피드 생성
      const userFeed: any = new FeedClass(1, existUser.id);

      // 타겟유저의 임시저장 피드 생성(보여지지 않아야 할 부분)

      const userTempFeed: any = new FeedClass(2, existUser.id);
      userTempFeed.status = 0;
      userTempFeed.postedAt = null;

      await dataSource.manager.save(Feed, [userFeed, userTempFeed]);

      // 타겟유저의 public comment 생성
      const userPublicComment: any = new CommentClass(
        1,
        userFeed.id,
        existUser.id,
        false
      );

      // 타겟유저의 private comment 생성
      const userPrivateComment: any = new CommentClass(
        2,
        userFeed.id,
        existUser.id,
        true
      );

      await dataSource.manager.save(Comment, [
        userPublicComment,
        userPrivateComment,
      ]);
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });
  });
});
