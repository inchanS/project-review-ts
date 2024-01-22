import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { Comment } from '../../entities/comment.entity';
import { Feed } from '../../entities/feed.entity';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { UserDto } from '../../entities/dto/user.dto';

// 테스트간 피드생성을 위한 피드 클래스 생성
class FeedClass {
  id: number;
  title: string;
  content: string;
  user: number;
  status: number;
  category: number;
  estimation: number;
  posted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  viewCnt: number;
  constructor(id: number, userId: number) {
    this.id = id;
    this.title = 'test title';
    this.content = 'test content';
    this.user = userId;
    this.status = 1;
    this.category = 1;
    this.estimation = 1;
    this.posted_at = new Date();
    this.created_at = new Date();
    this.updated_at = new Date();
    this.deleted_at = null;
    this.viewCnt = 0;
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

// 테스트간 게시물공감 데이터 생성을 위한 클래스 생성
class FeedSymbolClass {
  id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  feed: number;
  user: number;
  symbol: number;
  constructor(id: number, feedId: number, userId: number) {
    this.id = id;
    this.created_at = new Date();
    this.updated_at = new Date();
    this.deleted_at = null;
    this.feed = feedId;
    this.user = userId;
    this.symbol = 1;
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

    try {
      // migration은 한번 실행 이후, 재 실행시 작동하지않고 패스됨으로 다시 복귀시켜줘야 한다.
      // 1번 방법 : 마지막으로 실행된 migration 파일 롤백
      // await dataSource.undoLastMigration();

      // 2번 방법 : migration 파일 실행 전, schema 초기화
      await dataSource.synchronize(true).then(() => {
        console.log('💥TEST Data Source has been synchronized!');
      });
    } catch (error) {
      // 1번 방법시,
      // console.log('Migration rollback failed:', error);

      // 2번 방법시,
      console.log('Migration sync failed:', error);
    }

    await dataSource.runMigrations().then(() => {
      console.log('💥TEST Data Source has been runMigrations!');
    });
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

  describe('user validator service API - checkDuplicateNickname', () => {
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

  describe('user validator service API - checkDuplicateEmail', () => {
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
      const newUser = {
        nickname: 'newNickname',
        email: 'newEmail@email.com',
        password: 'newPassword@1234',
      };

      await request(app).post(`/users/signup`).send(newUser).expect(201);
    });
  });

  describe('user auth service API - signin', () => {
    const existUser: User = new User();
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
      const newUser: UserDto = {
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
      const newUser: UserDto = {
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
      const newUser: UserDto = {
        email: existUser.email,
        password: existUser.password,
      };

      const result = await request(app).post(`/users/signin`).send(newUser);

      expect(result.status).toBe(200);
      expect(result.body.message).toEqual('SIGNIN_SUCCESS');
      expect(result.body.result).toHaveProperty('token');
    });
  });

  describe('user Content - 로그인 사용자의 정보 조회 (api endpoint에서 사용자 ID가 없을 때)', () => {
    const existUser: User = new User();
    existUser.id = 1;
    existUser.nickname = 'existedNickname';
    existUser.email = 'existedEmail@email.com';
    existUser.password = 'existedPassword@1234';

    const newUser = {
      email: existUser.email,
      password: existUser.password,
    };

    const otherUser: User = new User();
    otherUser.id = 2;
    otherUser.nickname = 'otherNickname';
    otherUser.email = 'otherUser@email.com';
    otherUser.password = 'otherPassword@1234';

    // 반복되는 로그인 함수
    const signInUser = async (user: UserDto) => {
      return request(app).post(`/users/signin`).send(user);
    };

    // 토큰을 필요로 하는 http get 메소드 함수
    const makeAuthRequest = async (user: UserDto, endpoint: string) => {
      const authResponse = await signInUser(user);
      return request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${authResponse.body.result.token}`);
    };

    beforeAll(async () => {
      // 이미 존재하는 유저 생성
      await request(app).post(`/users/signup`).send(existUser);

      const userFeed: any = new FeedClass(1, existUser.id);
      await dataSource.manager.save(Feed, userFeed);

      await dataSource.manager.save(User, otherUser);

      const otherUserFeed: any = new FeedClass(2, otherUser.id);
      await dataSource.manager.save(Feed, otherUserFeed);

      const userPublicComment: any = new CommentClass(
        1,
        userFeed.id,
        existUser.id,
        false
      );

      const userPrivateComment: any = new CommentClass(
        2,
        userFeed.id,
        existUser.id,
        true
      );

      const userDeletedComment: any = new CommentClass(
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

      const userFeedSymbol: any = new FeedSymbolClass(1, 2, existUser.id);
      await dataSource.manager.save(FeedSymbol, userFeedSymbol);
    });

    afterAll(async () => {
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      await dataSource.manager.clear(User);
      await dataSource.manager.clear(Feed);
      await dataSource.manager.clear(Comment);
      await dataSource.manager.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    });

    test('user Content - getMyInfo - user id가 없으면서, 로그인도 되어있지 않을 때', async () => {
      const result = await request(app).get('/users/userinfo');

      expect(result.status).toBe(400);
      expect(result.body.message).toEqual('USER_ID_IS_UNDEFINED');
    });

    // 로그인 후 막 탈퇴한 회원의 유효성 검사
    test('user Content - getMyInfo - not_found_user', async () => {
      const tempUser = new User();
      tempUser.nickname = 'deleteNickname';
      tempUser.email = 'deleteEmail@email.com';
      tempUser.password = 'deletePassword@1234';

      await request(app).post(`/users/signup`).send(tempUser);

      const tempUserInfo = {
        email: tempUser.email,
        password: tempUser.password,
      };

      // 로그인 후, 토큰 발급
      const authResponse = await signInUser(tempUserInfo);

      // 인위적으로 DB에서 회원정보에 탈퇴정보를 추가하여 탈퇴회원으로 수정
      await dataSource.manager.update(
        User,
        { nickname: 'deleteNickname' },
        {
          deleted_at: new Date(),
        }
      );

      // 탈퇴 전 발급받은 토큰으로 정보조회 요청
      const result = await request(app)
        .get('/users/userinfo')
        .set('Authorization', `Bearer ${authResponse.body.result.token}`);

      expect(result.status).toBe(404);
      expect(result.body.message).toEqual('USER_IS_NOT_FOUND');
    });

    test('user Content - getMyInfo - success', async () => {
      const result = await makeAuthRequest(newUser, `/users/userinfo`);

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(6);
      expect(result.body.id).toEqual(existUser.id);
      expect(result.body.email).toEqual(existUser.email);
    });

    test('user Content - getMyFeedList - success', async () => {
      const result = await makeAuthRequest(newUser, `/users/userinfo/feeds`);

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      expect(result.body.feedCntByUserId).toEqual(existUser.id);
      expect(result.body.totalPage).toEqual(1);
      expect(result.body.feedListByUserId[0].title).toEqual('test title');
    });

    test('user Content - getMyCommentList - success', async () => {
      const result = await makeAuthRequest(newUser, `/users/userinfo/comments`);

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      // 로그인 사용자의 총 덧글 개수
      expect(result.body.commentCntByUserId).toEqual(3);
      // 로그인 사용자의 공개 덧글
      expect(result.body.commentListByUserId[2].comment).toEqual(
        'test comment'
      );
      // 로그인 사용자의 비공개 덧글
      expect(result.body.commentListByUserId[1].is_private).toEqual(true);
      // 로그인 사용자의 삭제 덧글
      expect(result.body.commentListByUserId[0].comment).toEqual(
        '## DELETED_COMMENT ##'
      );
    });

    test('user Content - getMyFeedSymbolList - success', async () => {
      const result = await makeAuthRequest(newUser, `/users/userinfo/symbols`);

      expect(result.status).toBe(200);
      expect(Object.keys(result.body)).toHaveLength(3);
      expect(result.body.symbolCntByUserId).toEqual(1);
      expect(result.body.symbolListByUserId[0].feed.id).toEqual(2);
      expect(result.body.symbolListByUserId[0].symbol.id).toEqual(1);
      expect(result.body.symbolListByUserId[0].symbol.symbol).toEqual('like');
    });
  });

  describe('타겟 유저의 정보 조회', () => {
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
