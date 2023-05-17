import dataSource from '../../repositories/data-source';
import { User } from '../../entities/users.entity';
import { createApp } from '../../app';
import request from 'supertest';
import { Comment } from '../../entities/comment.entity';
import { Feed } from '../../entities/feed.entity';
import { FeedSymbol } from '../../entities/feedSymbol.entity';

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualFeedListResponse(): R;
    }
  }
}

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
  parent: number | null;
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

  describe('checkDuplicateEmail or checkDuplicateNickname', () => {
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

  describe('사용자 정보조회', () => {
    const existUser = new User();
    existUser.id = 1;
    existUser.nickname = 'existedNickname';
    existUser.email = 'existedEmail@email.com';
    existUser.password = 'existedPassword@1234';

    const newUser = {
      email: existUser.email,
      password: existUser.password,
    };

    const otherUser = new User();
    otherUser.id = 2;
    otherUser.nickname = 'otherNickname';
    otherUser.email = 'otherUser@email.com';
    otherUser.password = 'otherPassword@1234';

    // 반복되는 로그인 함수
    const signInResultFn = async (user: {
      email: string;
      password: string;
    }) => {
      const result = await request(app).post(`/users/signin`).send(user);

      return result;
    };

    // 사용자 정보조회 중, 로그인 유저와 타겟 유저의 동일한 기대값에 대한 중복함수 처리
    // 1. Test Helper 함수 사용시 (사용하고자 하는 위치에서 함수 호출로 사용가능)
    // function expectFeedListResponse(result: any) {
    //   expect(result.status).toBe(200);
    //   expect(Array.isArray(result.body)).toBeTruthy();
    //   expect(result.body).toHaveLength(1);
    //   expect(result.body[0].userId).toEqual(existUser.id);
    //   expect(result.body[0].title).toEqual('test title');
    //   expect(result.body[0].content).toEqual('test content');
    // }

    // 2. Jest 확장함수 사용시 (사용하고자 하는 위치에서 함수 호출로 사용가능, but type 정의 필요)
    expect.extend({
      toEqualFeedListResponse(received) {
        expect(received.status).toBe(200);
        expect(Array.isArray(received.body)).toBeTruthy();
        expect(received.body).toHaveLength(1);
        expect(received.body[0].userId).toEqual(existUser.id);
        expect(received.body[0].title).toEqual('test title');
        expect(received.body[0].content).toEqual('test content');
        return {
          message: () => `expected ${received} to equal feed list response`,
          pass: true,
        };
      },
    });

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

    describe('로그인 사용자의 정보 조회 (api endpoint에서 사용자 ID가 path params로 없을 때)', () => {
      describe('User Info', () => {
        test('getMyInfo - user id가 없으면서, 로그인도 되어있지 않을 때', async () => {
          const result = await request(app).get('/users/userinfo');

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('USER_ID_IS_UNDEFINED');
        });

        test('getMyInfo - not_found_user', async () => {
          // 로그인 후 막 탈퇴한 회원의 유효성 검사
          const deleteUser = new User();
          deleteUser.nickname = 'deleteNickname';
          deleteUser.email = 'deleteEmail@email.com';
          deleteUser.password = 'deletePassword@1234';
          await request(app).post(`/users/signup`).send(deleteUser);

          const signInResult = await signInResultFn({
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
          const signInResult = await signInResultFn(newUser);

          const result = await request(app)
            .get(`/users/userinfo`)
            .set('Authorization', `Bearer ${signInResult.body.result.token}`);

          expect(result.status).toBe(200);
          expect(Object.keys(result.body)).toHaveLength(6);
          expect(result.body.id).toEqual(existUser.id);
          expect(result.body.email).toEqual(existUser.email);
        });
      });

      describe('User Feed List', () => {
        test('getMyFeedList - success', async () => {
          const signInResult = await signInResultFn(newUser);

          const result = await request(app)
            .get(`/users/userinfo/feeds`)
            .set('Authorization', `Bearer ${signInResult.body.result.token}`);

          expect(result).toEqualFeedListResponse();
        });

        test('getMyFeedList - Fail (not found user)', async () => {
          const result = await request(app).get(`/users/userinfo/feeds`);

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('USER_ID_IS_UNDEFINED');
        });

        test('getMyFeedList - Fail (query error)', async () => {
          const signInResult = await signInResultFn(newUser);

          const result = await request(app)
            .get(`/users/userinfo/feeds`)
            .query({ page: 0, limit: 10 })
            .set('Authorization', `Bearer ${signInResult.body.result.token}`);

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('PAGE_START_INDEX_IS_INVALID');
        });
      });

      describe('User Comment List', () => {
        test('getMyCommentList - success', async () => {
          const signInResult = await signInResultFn(newUser);

          const result = await request(app)
            .get(`/users/userinfo/comments`)
            .set('Authorization', `Bearer ${signInResult.body.result.token}`);

          expect(result.status).toBe(200);
          expect(Array.isArray(result.body)).toBeTruthy();
          expect(result.body).toHaveLength(3);
          // 로그인 사용자의 공개 덧글
          expect(result.body[0].comment).toEqual('test comment');
          // 로그인 사용자의 비공개 덧글
          expect(result.body[1].comment).toEqual('test comment');
          // 로그인 사용자의 삭제 덧글
          expect(result.body[2].comment).toEqual('## DELETED_COMMENT ##');
        });

        test('getMyCommentList - Fail (not found user)', async () => {
          const result = await request(app).get(`/users/userinfo/comments`);

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('USER_ID_IS_UNDEFINED');
        });
      });

      describe('User Symbol List', () => {
        test('getMyFeedSymbolList - success', async () => {
          const signInResult = await signInResultFn(newUser);

          const result = await request(app)
            .get(`/users/userinfo/symbols`)
            .set('Authorization', `Bearer ${signInResult.body.result.token}`);

          expect(result.status).toBe(200);
          expect(Array.isArray(result.body)).toBeTruthy();
          expect(result.body).toHaveLength(1);
          expect(result.body[0].feed.id).toEqual(2);
          expect(result.body[0].symbol.id).toEqual(1);
          expect(result.body[0].symbol.symbol).toEqual('like');
        });

        test('getMySymbolList - Fail (not found user)', async () => {
          const result = await request(app).get(`/users/userinfo/symbol`);

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('USER_ID_IS_UNDEFINED');
        });

        test('getMySymbolList - Fail (query error)', async () => {
          const signInResult = await signInResultFn(newUser);

          const result = await request(app)
            .get(`/users/userinfo/symbols`)
            .query({ page: 0, limit: 10 })
            .set('Authorization', `Bearer ${signInResult.body.result.token}`);

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('PAGE_START_INDEX_IS_INVALID');
        });
      });
    });

    describe('타겟 사용자의 정보 조회 (api endpoint에서 사용자 ID가  path params로 있을 때)', () => {
      describe('User Info', () => {
        test('getUserInfo - Fail: not_found_user', async () => {
          const result = await request(app).get('/users/userinfo/3');

          expect(result.status).toBe(404);
          expect(result.body.message).toEqual('USER_IS_NOT_FOUND');
        });

        test('getUserInfo - success', async () => {
          const result = await request(app).get('/users/userinfo/1');

          expect(result.status).toBe(200);
          expect(Object.keys(result.body)).toHaveLength(6);
          expect(result.body.id).toEqual(existUser.id);
          expect(result.body.email).toEqual(existUser.email);
        });
      });

      describe('User Feed List', () => {
        test('getUserFeedList - success', async () => {
          const result = await request(app).get(`/users/userinfo/1/feeds`);

          expect(result).toEqualFeedListResponse();
        });

        test('getUserFeedList - Fail (not found user)', async () => {
          const result = await request(app).get(`/users/userinfo/feeds`);

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('USER_ID_IS_UNDEFINED');
        });

        test('getUserFeedList - Fail (query error)', async () => {
          const result = await request(app)
            .get(`/users/userinfo/1/feeds`)
            .query({ page: 0, limit: 10 });

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('PAGE_START_INDEX_IS_INVALID');
        });
      });

      describe('User Comment List', () => {
        test('getUserCommentList - success (로그아웃에서의 요청)', async () => {
          const result = await request(app).get(`/users/userinfo/1/comments`);

          expect(result.status).toBe(200);
          expect(Array.isArray(result.body)).toBeTruthy();
          expect(result.body).toHaveLength(3);
          // 로그인 사용자의 공개 덧글
          expect(result.body[0].comment).toEqual('test comment');
          // 로그인 사용자의 비공개 덧글
          expect(result.body[1].comment).toEqual('## PRIVATE_COMMENT ##');
          // 로그인 사용자의 삭제 덧글
          expect(result.body[2].comment).toEqual('## DELETED_COMMENT ##');
        });

        test('getUserCommentList - success (로그인에서의 요청)', async () => {
          // 로그인 사용자 생성
          const existUser2 = new User();
          existUser2.id = 3;
          existUser2.nickname = 'existedNickname2';
          existUser2.email = 'existedEmail2@email.com';
          existUser2.password = 'existedPassword@1234';

          const newUser2 = {
            email: existUser2.email,
            password: existUser2.password,
          };

          await request(app).post(`/users/signup`).send(existUser2);

          // 로그인 사용자에게 작성한 기존 유저의 비공개 댓글 생성
          const newComment: any = new CommentClass(4, 1, existUser2.id, false);
          newComment.comment = 'comment by existedUser2';

          const newPrivateComment: any = new CommentClass(
            5,
            1,
            existUser.id,
            true
          );
          newPrivateComment.comment = 'private comment by existedUser2';
          newPrivateComment.parent = 4;

          await dataSource.manager.save(Comment, [
            newComment,
            newPrivateComment,
          ]);

          const signInResult = await signInResultFn(newUser2);
          const result = await request(app)
            .get(`/users/userinfo/1/comments`)
            .set('Authorization', `Bearer ${signInResult.body.result.token}`);

          console.log('🔥users.api.test/:674- result.body = ', result.body);

          expect(result.status).toBe(200);
          expect(Array.isArray(result.body)).toBeTruthy();
          expect(result.body).toHaveLength(4);
          // expect(result.body[0].comment).toEqual(
          //   'private comment by existedUser2'
          // );
          // 로그인 사용자의 공개 덧글
          // expect(result.body[1].comment).toEqual('test comment');
          // // 로그인 사용자의 비공개 덧글
          // expect(result.body[2].comment).toEqual('## PRIVATE_COMMENT ##');
          // // 로그인 사용자의 삭제 덧글
          // expect(result.body[3].comment).toEqual('## DELETED_COMMENT ##');
        });

        test('getUserCommentList - Fail (not found user)', async () => {
          const result = await request(app).get(`/users/userinfo/comments`);

          expect(result.status).toBe(400);
          expect(result.body.message).toEqual('USER_ID_IS_UNDEFINED');
        });
      });
    });
  });
});
