import { User } from '../../entities/users.entity';
import usersService from '../../services/users.service';
import { UserDto } from '../../entities/dto/user.dto';
import { UserRepository } from '../../repositories/user.repository';
import bcrypt from 'bcryptjs';
import { Feed } from '../../entities/feed.entity';
import {
  FeedListRepository,
  FeedRepository,
} from '../../repositories/feed.repository';
import { Comment } from '../../entities/comment.entity';
import { CommentRepository } from '../../repositories/comment.repository';
import jwt from 'jsonwebtoken';
import dataSource from '../../repositories/data-source';
import UploadFileService, {
  DeleteUploadFiles,
} from '../../services/uploadFile.service';
import * as util from '../../utils/sendMail';
import { FeedSymbol } from '../../entities/feedSymbol.entity';
import { FeedSymbolRepository } from '../../repositories/feedSymbol.repository';

describe('USERS UNIT test', () => {
  describe('checkDuplicateNickname', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('닉네임이 잘못된 parameter로 전달되었을 때, 에러 반환', async () => {
      // version1. 에러메세지만 확인하고자 할 때, 'toThrow' 사용
      // await expect(
      //   usersService.checkDuplicateNickname(undefined)
      // ).rejects.toThrow('NICKNAME_IS_UNDEFINED');

      // version2. 에러메세지와 에러코드를 확인하고자 할 때, 'toMatchObject' 사용
      const errorObject = {
        status: 400,
        message: 'NICKNAME_IS_UNDEFINED',
      };

      await expect(
        usersService.checkDuplicateNickname(undefined)
      ).rejects.toMatchObject(errorObject);
      await expect(
        usersService.checkDuplicateNickname(null)
      ).rejects.toMatchObject(errorObject);
      await expect(
        usersService.checkDuplicateNickname('')
      ).rejects.toMatchObject(errorObject);
    });

    test('중복이 아닌 닉네임이 전달되었을 때, 성공 반환', async () => {
      const nickname: string = 'newNickname';

      jest.spyOn(User, 'findByNickname').mockResolvedValueOnce(null);

      const result = await usersService.checkDuplicateNickname(nickname);

      expect(result).toEqual({ message: 'AVAILABLE_NICKNAME' });
      expect(User.findByNickname).toBeCalledTimes(1);
      expect(User.findByNickname).toBeCalledWith(nickname);
    });

    test('전달된 닉네임이 중복일 때, 에러 반환', async () => {
      const nickname: string = 'nickname';

      const mockUser = new User();
      mockUser.nickname = 'nickname';

      jest.spyOn(User, 'findByNickname').mockResolvedValueOnce(mockUser);

      await expect(
        usersService.checkDuplicateNickname(nickname)
      ).rejects.toMatchObject({
        status: 409,
        message: 'nickname_IS_NICKNAME_THAT_ALREADY_EXSITS',
      });
    });
  });

  describe('checkDuplicateEmail', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('이메일이 undefined 일 때, 에러 반환', async () => {
      const errorObject = {
        status: 400,
        message: 'EMAIL_IS_UNDEFINED',
      };

      await expect(
        usersService.checkDuplicateEmail(undefined)
      ).rejects.toMatchObject(errorObject);

      await expect(
        usersService.checkDuplicateEmail(null)
      ).rejects.toMatchObject(errorObject);

      await expect(usersService.checkDuplicateEmail('')).rejects.toMatchObject(
        errorObject
      );
    });

    test('이메일 중복이 아닐 때, 성공', async () => {
      const email: string = 'newEmail';

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(null);

      const result = await usersService.checkDuplicateEmail(email);

      expect(result).toEqual({ message: 'AVAILABLE_EMAIL' });
      expect(User.findByEmail).toBeCalledTimes(1);
      expect(User.findByEmail).toBeCalledWith(email);
    });

    test('이메일 중복일 때, 에러 반환', async () => {
      const email: string = 'email';

      const mockUser = new User();
      mockUser.email = 'email';

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(mockUser);

      await expect(
        usersService.checkDuplicateEmail(email)
      ).rejects.toMatchObject({
        status: 409,
        message: 'email_IS_EMAIL_THAT_ALREADY_EXSITS',
      });
    });
  });

  describe('signUp', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    test('password가 정규식을 통과하지 못하였을 때, 에러 반환', async () => {
      const userInfo: UserDto = {
        email: 'email@mail.com',
        nickname: 'nickname',
        password: 'password',
      };

      await expect(usersService.signUp(userInfo)).rejects.toEqual({
        status: 500,
        message: {
          matches: 'password only accepts english and number 그리고 특수기호',
        },
      });
    });

    test('password가 8자보다 짧거나 20자보다 길 때, 에러 반환', async () => {
      const minPasswordUser: UserDto = {
        email: 'email@mail.com',
        nickname: 'nickname',
        password: '1234',
      };

      const maxPasswordUser: UserDto = {
        email: 'email@mail.com',
        nickname: 'nickname',
        password:
          'Password@1234567890123456789012323456789012345678901234567890',
      };

      await expect(usersService.signUp(minPasswordUser)).rejects.toMatchObject({
        status: 500,
        message: {
          minLength: 'password must be longer than or equal to 8 characters',
        },
      });

      await expect(usersService.signUp(maxPasswordUser)).rejects.toMatchObject({
        status: 500,
        message: {
          maxLength: 'password must be shorter than or equal to 20 characters',
        },
      });
    });

    test('email 형식이 아닐 때, 에러 반환', async () => {
      const userInfo: UserDto = {
        email: 'email',
        nickname: 'nickname',
        password: 'Password123@#',
      };

      await expect(usersService.signUp(userInfo)).rejects.toEqual({
        status: 500,
        message: {
          isEmail: 'email must be an email',
        },
      });
    });

    test('회원가입 성공', async () => {
      const userInfo: UserDto = {
        email: '123@test.com',
        nickname: 'nickname',
        password: 'Password123@#',
      };

      const mockFindByEmail = jest.fn();
      jest.spyOn(User, 'findByEmail').mockImplementation(mockFindByEmail);

      const mockFindByNickname = jest.fn();
      jest.spyOn(User, 'findByNickname').mockImplementation(mockFindByNickname);

      const mockCreateUser = jest.fn();
      jest
        .spyOn(UserRepository, 'createUser')
        .mockImplementation(mockCreateUser);

      await usersService.signUp(userInfo);

      expect(mockCreateUser).toBeCalledTimes(1);
      expect(mockCreateUser).toBeCalledWith(userInfo);
    });
  });

  describe('signIn', () => {
    const email: string = 'email';
    const password: string = 'password';
    const fakeToken = 'fake_token';

    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User();
    user.password = hashedPassword;

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('사용자 중 해당 이메일을 찾을 수 없을 때, 에러반환', async () => {
      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(null);

      await expect(usersService.signIn(email, password)).rejects.toEqual({
        status: 404,
        message: 'email_IS_NOT_FOUND',
      });
    });

    test('사용자 중 해당 이메일이 삭제된 사용자일 때, 에러반환', async () => {
      const deletedUser = new User();
      deletedUser.deleted_at = new Date();

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(deletedUser);
    });

    test('비밀번호가 일치하지 않을 때, 에러반환', async () => {
      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(user);

      await expect(
        usersService.signIn(email, 'wrong_password')
      ).rejects.toEqual({
        status: 401,
        message: 'PASSWORD_IS_INCORRECT',
      });
    });

    test('로그인 성공', async () => {
      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(user);

      jwt.sign = jest.fn().mockImplementation(() => fakeToken);

      const result = await usersService.signIn(email, password);

      expect(result).toEqual({
        token: fakeToken,
      });
    });
  });

  describe('findUserInfoById', () => {
    const userId: number = 1;
    const user = new User();
    user.id = userId;

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('사용자를 찾을 수 없을 때, 에러반환', async () => {
      jest.spyOn(UserRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(
        usersService.findUserInfoByUserId(userId)
      ).rejects.toMatchObject({
        status: 404,
        message: 'USER_IS_NOT_FOUND',
      });
    });

    test('사용자를 찾을 수 있을 때, 성공', async () => {
      jest.spyOn(UserRepository, 'findOne').mockResolvedValue(user);

      const result = await usersService.findUserInfoByUserId(userId);

      // 함수 과정 확인
      expect(UserRepository.findOne).toBeCalledTimes(1);
      expect(UserRepository.findOne).toBeCalledWith({ where: { id: userId } });

      // 함수 결과물 형식 확인 - User 객체로 반환되어야 한다.
      expect(result instanceof User).toBe(true);
      // 함수 결과물 값 확인 - id가 일치해야 한다.
      expect(result.id).toEqual(userId);

      // 사용자 정보 중, password는 반환하지 않는다.
      expect(result.password).toEqual(undefined);
    });
  });

  describe('findUserFeedsByUserId', () => {
    const userId: number = 1;
    const user = new User();
    user.id = userId;

    // 사용자의 피드는 3개라고 가정한다.
    const userFeedCount: number = 3;
    const userFeedList: Feed[] = Array(userFeedCount)
      .fill(null)
      .map((_, index) => {
        const userFeed = new Feed();
        userFeed.id = index + 1;
        userFeed.user = user;
        userFeed.title = 'title';
        userFeed.content = 'content';
        userFeed.created_at = new Date();
        userFeed.updated_at = new Date();

        return userFeed;
      });

    beforeEach(() => {
      jest.restoreAllMocks();

      jest
        .spyOn(FeedRepository, 'getFeedCountByUserId')
        .mockResolvedValue(userFeedCount);

      jest
        .spyOn(FeedListRepository, 'getFeedListByUserId')
        .mockResolvedValue(userFeedList);
    });

    test('userId가 전달되지 않았을 때, 에러메세지 반환', async () => {
      try {
        await usersService.findUserFeedsByUserId(undefined, undefined);
      } catch (error: any) {
        expect(error.status).toEqual(400);
        expect(error.message).toEqual('USER_ID_IS_UNDEFINED');
      }
    });

    test.each([
      { startIndex: undefined, limit: undefined },
      { startIndex: 1, limit: undefined },
      { startIndex: undefined, limit: 10 },
    ])(
      'page객체의 key중 하나라도 Number가 아닌 type으로 전달되었을 때, page = undefiend로 변환',
      async page => {
        await expect(
          usersService.findUserFeedsByUserId(userId, page)
        ).toBeDefined();

        expect(FeedListRepository.getFeedListByUserId).toHaveBeenCalledWith(
          userId,
          undefined,
          undefined
        );
      }
    );

    test.each([
      { startIndex: 0, limit: 10 },
      { startIndex: -1, limit: 10 },
    ])(
      '페이지의 startIndex 파라미터가 1보다 작은 수로 전달되었을 때, 에러메세지 반환',
      async wrongPage => {
        await expect(
          usersService.findUserFeedsByUserId(userId, wrongPage)
        ).rejects.toEqual({
          status: 400,
          message: 'PAGE_START_INDEX_IS_INVALID',
        });
      }
    );

    test.each([
      { input: { startIndex: 1, limit: 4 }, expectedTotalPage: 1 },
      { input: { startIndex: 2, limit: 2 }, expectedTotalPage: 2 },
    ])(
      'limit 값에 따른 totalPage 반환 확인',
      async ({ input, expectedTotalPage }) => {
        const result = await usersService.findUserFeedsByUserId(userId, input);

        expect(result).toBeDefined();
        expect(result.totalPage).toEqual(expectedTotalPage);
      }
    );

    test('limit 값이 undefined일 때, totalPage = 1 반환 확인', async () => {
      const result = await usersService.findUserFeedsByUserId(userId, {
        startIndex: 0,
        limit: undefined,
      });

      expect(result).toBeDefined();
      expect(result.totalPage).toEqual(1);
    });

    test('사용자의 게시물리스트  반환 성공', async () => {
      const page = { startIndex: 2, limit: 2 };
      const result = await usersService.findUserFeedsByUserId(userId, page);

      // 함수 과정 확인
      expect(FeedRepository.getFeedCountByUserId).toBeCalledTimes(1);
      expect(FeedRepository.getFeedCountByUserId).toBeCalledWith(userId);
      expect(FeedListRepository.getFeedListByUserId).toBeCalledTimes(1);
      expect(FeedListRepository.getFeedListByUserId).toBeCalledWith(
        userId,
        page,
        undefined
      );

      // 함수 결과물 확인
      expect(result).toBeDefined();
      expect(result.feedCntByUserId).toEqual(userFeedCount);
      expect(result.totalPage).toEqual(2);
      expect(result.feedListByUserId).toEqual(userFeedList);
    });
  });

  describe('findUserCommentsByUserId', () => {
    const userId: number = 1;
    const user = new User();
    user.id = userId;

    // 사용자의 댓글은 3개라고 가정한다.
    const userCommentCount: number = 3;
    //   // mySQL에서 출력되는 Date타입의 String 형식
    const dateToString: string = '2021-01-01T00:00:00.000Z';
    const userCommentList: Comment[] = Array(userCommentCount)
      .fill(null)
      .map((_, index) => {
        const userComment: any = new Comment();
        userComment.id = index + 1;
        userComment.user = user;
        userComment.comment = 'comment';
        userComment.created_at = dateToString;
        userComment.updated_at = dateToString;

        return userComment;
      });

    beforeEach(() => {
      jest.restoreAllMocks();

      jest
        .spyOn(CommentRepository, 'getCommentCountByUserId')
        .mockResolvedValue(userCommentCount);

      jest
        .spyOn(CommentRepository, 'getCommentListByUserId')
        .mockResolvedValue(userCommentList);
    });

    test('사용자 정보가 전달되지 않았을 때, 에러메세지 반환', async () => {
      await expect(
        usersService.findUserCommentsByUserId(undefined, undefined)
      ).rejects.toEqual({
        status: 400,
        message: 'USER_ID_IS_UNDEFINED',
      });
    });

    test.each([
      { startIndex: undefined, limit: undefined },
      { startIndex: 1, limit: undefined },
      { startIndex: undefined, limit: 10 },
    ])(
      'page객체의 key중 하나라도 Number가 아닌 type으로 전달되었을 때, page = undefiend로 변환',
      async page => {
        await expect(
          usersService.findUserCommentsByUserId(userId, undefined, page)
        ).toBeDefined();

        expect(CommentRepository.getCommentListByUserId).toHaveBeenCalledWith(
          userId,
          undefined
        );
      }
    );

    test.each([
      { input: { startIndex: 1, limit: 4 }, expectedTotalPage: 1 },
      { input: { startIndex: 2, limit: 2 }, expectedTotalPage: 2 },
    ])(
      'limit 값에 따른 totalScrollCnt 반환 확인',
      async ({ input, expectedTotalPage }) => {
        const result = await usersService.findUserCommentsByUserId(
          userId,
          undefined,
          input
        );

        expect(result).toBeDefined();
        expect(result.totalScrollCnt).toEqual(expectedTotalPage);
      }
    );

    test('limit 값이 undefined일 때, totalScrollCnt = 1 반환 확인', async () => {
      const result = await usersService.findUserCommentsByUserId(
        userId,
        undefined,
        { startIndex: 0, limit: undefined }
      );

      expect(result).toBeDefined();
      expect(result.totalScrollCnt).toEqual(1);
    });

    test('댓글의 날짜 정보들이 제대로 변환되어 반환되는지 확인', async () => {
      const result = await usersService.findUserCommentsByUserId(
        userId,
        undefined,
        { startIndex: 0, limit: undefined }
      );

      expect(result).toBeDefined();
      expect(result.commentListByUserId).toEqual(
        userCommentList.map(comment => {
          comment.created_at = new Date(dateToString);
          comment.updated_at = new Date(dateToString);

          return comment;
        })
      );
    });

    test('성공: 비공개 댓글과 날짜 형식이 정상적으로 동작하는지 확인', async () => {
      const loggedInUserId = 2;
      const otherUserid = 3;

      // 다른 사용자의 비공개 댓글
      const comment1: any = {
        is_private: true,
        user: { id: userId },
        comment: 'Original Comment',
        created_at: dateToString,
        updated_at: dateToString,
        deleted_at: null,
        feed: { user: { id: otherUserid } },
      };

      // 다른 사용자의 삭제된 댓글
      const comment2: any = {
        is_private: false,
        user: { id: userId },
        comment: 'Original Comment',
        created_at: dateToString,
        updated_at: dateToString,
        deleted_at: dateToString,
        feed: { user: { id: otherUserid } },
      };

      // 다른 사용자의 공개 댓글
      const comment3: any = {
        is_private: false,
        user: { id: userId },
        comment: 'Original Comment',
        created_at: dateToString,
        updated_at: dateToString,
        deleted_at: null,
        feed: { user: { id: otherUserid } },
      };

      // 본인의 댓글에 대한 다른 사용자의 비공개 '대댓글'
      const comment4: any = {
        is_private: true,
        user: { id: userId },
        comment: 'Original Comment',
        parent: { user: { id: loggedInUserId } },
        created_at: dateToString,
        updated_at: dateToString,
        deleted_at: null,
        feed: { user: { id: otherUserid } },
      };

      // 본인의 게시글에 달린 다른 사용자의 비공개 댓글
      const comment5: any = {
        is_private: true,
        user: { id: userId },
        comment: 'Original Comment',
        created_at: dateToString,
        updated_at: dateToString,
        deleted_at: null,
        feed: { user: { id: loggedInUserId } },
      };

      // 본인의 비공개 댓글
      const comment6: any = {
        is_private: true,
        user: { id: loggedInUserId },
        comment: 'Original Comment',
        created_at: dateToString,
        updated_at: dateToString,
        deleted_at: null,
        feed: { user: { id: otherUserid } },
      };

      CommentRepository.getCommentListByUserId = jest
        .fn()
        .mockResolvedValue([
          comment1,
          comment2,
          comment3,
          comment4,
          comment5,
          comment6,
        ]);

      // 아래 함수는 위 함수와 같이 작동, but, jest.spyOn을 사용하면, 과정 추적도 가능하다.
      // 현재의 테스트에서는 단순 반환값만 모의하면 되기에 위 jest.fn()을 사용

      // jest
      //   .spyOn(CommentRepository, 'getCommentListByUserId')
      //   .mockResolvedValue([
      //     comment1,
      //     comment2,
      //     comment3,
      //     comment4,
      //     comment5,
      //     comment6,
      //   ]);

      const result = await usersService.findUserCommentsByUserId(
        userId,
        loggedInUserId,
        { startIndex: undefined, limit: undefined }
      );

      expect(result).toBeDefined();
      // 다른 사용자의 비공개 댓글
      expect(result.commentListByUserId[0].comment).toBe(
        '## PRIVATE_COMMENT ##'
      );
      // 다른 사용자의 삭제된 댓글
      expect(result.commentListByUserId[1].comment).toBe(
        '## DELETED_COMMENT ##'
      );
      // 다른 사용자의 공개 댓글
      expect(result.commentListByUserId[2].comment).toBe('Original Comment');
      // 본인의 댓글에 대한 다른 사용자의 비공개 '대댓글'
      expect(result.commentListByUserId[3].comment).toBe('Original Comment');
      // 본인의 게시글에 달린 다른 사용자의 비공개 댓글
      expect(result.commentListByUserId[4].comment).toBe('Original Comment');
      // 본인의 비공개 댓글
      expect(result.commentListByUserId[5].comment).toBe('Original Comment');
      // 모든 댓글이 반환되는지 확인
      expect(result.commentListByUserId.length).toBe(6);
    });

    test('성공: 모든 요소를 반환하는지 확인', async () => {
      const comment: any = new Comment();
      comment.created_at = dateToString;
      comment.updated_at = dateToString;
      comment.deleted_at = null;

      CommentRepository.getCommentListByUserId = jest
        .fn()
        .mockResolvedValue([comment]);

      const result = await usersService.findUserCommentsByUserId(
        userId,
        undefined,
        { startIndex: 0, limit: undefined }
      );

      expect(result).toBeDefined();
      expect(result.commentListByUserId).toBeDefined();
      expect(result.commentCntByUserId).toBeDefined();
      expect(result.commentListByUserId).toBeDefined();
    });
  });

  describe('findUserFeedSymbolsByUserId', () => {
    jest.mock('../../repositories/feedSymbol.repository', () => ({
      getFeedSymbolCountByUserId: jest.fn(),
      getFeedSymbolsByUserId: jest.fn(),
    }));

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('사용자의 게시물좋아요 표시 반환 - 성공', async () => {
      const fakeCount = 10;
      const fakeSymbols = [{ id: 1 }, { id: 2 }];
      const fakeUserId = 123;
      const fakePage = { startIndex: 1, limit: 10 };

      FeedSymbolRepository.getFeedSymbolCountByUserId = jest
        .fn()
        .mockResolvedValue(fakeCount);

      FeedSymbolRepository.getFeedSymbolsByUserId = jest
        .fn()
        .mockResolvedValue(fakeSymbols);

      const result = await usersService.findUserFeedSymbolsByUserId(
        fakeUserId,
        fakePage
      );

      expect(result.symbolCntByUserId).toBe(fakeCount);
      expect(result.totalPage).toBe(1);
      expect(result.symbolListByUserId).toEqual(fakeSymbols);

      expect(FeedSymbolRepository.getFeedSymbolCountByUserId).toBeCalledWith(
        fakeUserId
      );
      expect(FeedSymbolRepository.getFeedSymbolsByUserId).toBeCalledWith(
        fakeUserId,
        fakePage
      );
    });
  });

  describe('updateUserInfo', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('변경사항이 없을 때 에러 반환', async () => {
      const userId: number = 1;

      const originUserInfo = new User();
      originUserInfo.id = userId;
      originUserInfo.nickname = 'nickname';
      originUserInfo.email = 'email@email.com';

      const updateUserInfoDto: UserDto = new UserDto();
      updateUserInfoDto.nickname = 'nickname';
      updateUserInfoDto.email = 'email@email.com';

      jest
        .spyOn(UserRepository, 'findOne')
        .mockResolvedValueOnce(originUserInfo);

      try {
        await usersService.updateUserInfo(userId, updateUserInfoDto);
      } catch (error: any) {
        expect(error.status).toEqual(400);
        expect(error.message).toEqual(`NO_CHANGE`);
      }
    });

    test('email이 변경되었을 때, 성공', async () => {
      const userId: number = 1;

      const originUserInfo = new User();
      originUserInfo.id = userId;
      originUserInfo.nickname = 'nickname';
      originUserInfo.email = 'origin@email.com';

      const updateUserInfoDto: UserDto = new UserDto();
      updateUserInfoDto.nickname = 'nickname';
      updateUserInfoDto.email = 'update@email.com';

      const updatedUserInfo = new User();
      updatedUserInfo.id = userId;
      updatedUserInfo.nickname = 'nickname';
      updatedUserInfo.email = updateUserInfoDto.email;

      jest
        .spyOn(UserRepository, 'findOne')
        .mockResolvedValueOnce(originUserInfo);

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(null);

      jest.spyOn(UserRepository, 'update').mockResolvedValueOnce(null);

      jest
        .spyOn(UserRepository, 'findOne')
        .mockResolvedValueOnce(updatedUserInfo);

      const result = await usersService.updateUserInfo(
        userId,
        updateUserInfoDto
      );

      // 함수 과정 확인
      expect(UserRepository.findOne).toBeCalledTimes(2);
      expect(UserRepository.findOne).toBeCalledWith({ where: { id: userId } });
      expect(User.findByEmail).toBeCalledTimes(1);
      expect(User.findByEmail).toBeCalledWith(updateUserInfoDto.email);
      expect(UserRepository.update).toBeCalledTimes(1);
      expect(UserRepository.update).toBeCalledWith(userId, updateUserInfoDto);

      // 함수 결과물 형식 확인
      expect(result).toBeDefined();
      expect(result).toEqual(updatedUserInfo);
    });
  });

  describe('deleteUser', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    test('사용자를 찾을 수 없을 때, 에러반환', async () => {
      const userId: number = 1;

      jest.spyOn(UserRepository, 'findOne').mockResolvedValueOnce(null);

      try {
        await usersService.deleteUser(userId);
      } catch (error: any) {
        expect(error.status).toEqual(404);
        expect(error.message).toEqual(`USER_IS_NOT_FOUND`);
      }
    });

    describe('사용자를 찾을 수 있을 때, 성공 케이스들', () => {
      // 사용자 정보를 찾을 수 있을 때의 공통 함수
      const userId: number = 1;

      const user = new User();
      user.id = userId;

      const mockUserFeeds = [
        {
          id: 1,
          userId: 1,
          postedAt: new Date(),
          statusId: 1,
        },
        {
          id: 2,
          title: 'title',
          userId: 1,
          postedAt: null as any,
          statusId: 1,
        },
      ];

      const mockUserComments = [
        {
          id: 1,
          user: 1,
          created_at: '2022-01-01T00:00:00.000Z',
          updated_at: '2022-01-01T00:00:00.000Z',
          deleted_at: null as any,
        },
        {
          id: 2,
          user: 1,
          created_at: '2022-01-01T00:00:00.000Z',
          updated_at: '2022-01-01T00:00:00.000Z',
          deleted_at: null as any,
        },
      ];

      const mockUserSymbols = [
        {
          id: 1,
          user: 1,
        },
        {
          id: 2,
          user: 1,
        },
      ];

      const mockUserUploadFiles: DeleteUploadFiles = {
        uploadFileWithoutFeedId: [1, 2, 3],
        deleteFileLinksArray: ['123', '456', '789'],
      };

      let queryRunnerMock: any;

      beforeEach(() => {
        jest.resetAllMocks();

        queryRunnerMock = jest.fn().mockReturnValue({
          connect: jest.fn(),
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
          release: jest.fn(),
          manager: {
            softDelete: jest.fn(),
          },
        });

        jest.spyOn(UserRepository, 'findOne').mockResolvedValue(user);

        jest
          .spyOn(dataSource, 'createQueryRunner')
          .mockImplementation(queryRunnerMock);

        jest
          .spyOn(FeedListRepository, 'getFeedListByUserId')
          .mockResolvedValue(mockUserFeeds);

        jest
          .spyOn(dataSource.manager, 'find')
          .mockResolvedValue(mockUserSymbols);

        jest
          .spyOn(UploadFileService, 'deleteUnusedUploadFiles')
          .mockResolvedValue(mockUserUploadFiles);
        jest
          .spyOn(UploadFileService, 'deleteUnconnectedLinks')
          .mockResolvedValue(null);
      });

      test('사용자의 feed, comment, symbol 정보가 모두 있을때', async () => {
        jest
          .spyOn(CommentRepository, 'getCommentListByUserId')
          .mockResolvedValue(mockUserComments);

        const result = await usersService.deleteUser(userId);

        // 함수 과정 확인
        expect(UserRepository.findOne).toBeCalledTimes(1);
        expect(UserRepository.findOne).toBeCalledWith({
          where: { id: userId },
        });

        expect(queryRunnerMock().manager.softDelete).toBeCalledTimes(4);
        expect(queryRunnerMock().manager.softDelete).toBeCalledWith(
          User,
          userId
        );

        expect(result).toBeUndefined();
        // user 삭제 과정의 함수 확인
        expect(queryRunnerMock().manager.softDelete).toBeCalledWith(User, 1);
        // feed 삭제 과정의 함수 확인
        expect(queryRunnerMock().manager.softDelete).toBeCalledWith(
          Feed,
          [1, 2]
        );
        // feed의 uploadFile 삭제 과정의 함수 확인
        expect(UploadFileService.deleteUnusedUploadFiles).toBeCalledTimes(1);
        expect(UploadFileService.deleteUnusedUploadFiles).toBeCalledWith(
          queryRunnerMock(),
          userId
        );
        expect(UploadFileService.deleteUnconnectedLinks).toBeCalledTimes(1);
        expect(UploadFileService.deleteUnconnectedLinks).toBeCalledWith(
          queryRunnerMock(),
          mockUserUploadFiles.uploadFileWithoutFeedId,
          mockUserUploadFiles.deleteFileLinksArray,
          userId
        );
        // comment 삭제 과정의 함수 확인
        expect(queryRunnerMock().manager.softDelete).toBeCalledWith(
          Comment,
          [1, 2]
        );
        // symbol 삭제 과정의 함수 확인
        expect(queryRunnerMock().manager.softDelete).toBeCalledWith(
          FeedSymbol,
          [1, 2]
        );
      });

      test('사용자의 comment 정보가 없을때', async () => {
        jest
          .spyOn(CommentRepository, 'getCommentListByUserId')
          .mockResolvedValue([]);

        const result = await usersService.deleteUser(userId);

        // 함수 과정 확인
        expect(UserRepository.findOne).toBeCalledTimes(1);
        expect(UserRepository.findOne).toBeCalledWith({
          where: { id: userId },
        });

        expect(queryRunnerMock().manager.softDelete).toBeCalledTimes(3);
        expect(queryRunnerMock().manager.softDelete).toBeCalledWith(
          User,
          userId
        );

        expect(result).toBeUndefined();
      });
    });
  });

  describe('resetPassword', () => {
    const email = 'creseeds@gmail.com';
    const resetPasswordUrl = 'http://localhost:3000/reset-password';

    const findOneMock = jest.spyOn(UserRepository, 'findOneOrFail');

    beforeEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('사용자를 찾을 수 없을 때, 에러반환', async () => {
      findOneMock.mockRejectedValueOnce(new Error('USER_IS_NOT_FOUND'));
      jest.spyOn(UserRepository, 'findOneOrFail');

      await expect(
        usersService.resetPassword(email, resetPasswordUrl)
      ).rejects.toEqual({
        status: 404,
        message: 'USER_IS_NOT_FOUND',
      });

      expect(findOneMock).toBeCalledTimes(1);
      expect(findOneMock).toBeCalledWith({ where: { email } });
    });

    test('사용자를 찾을 수 있을 때, 성공', async () => {
      const user = new User();
      user.id = 1;

      findOneMock.mockResolvedValue(user);

      const sendMailSpy = jest.spyOn(util, 'sendMail').mockResolvedValue(null);

      jest.spyOn(jwt, 'sign').mockImplementation(() => 'testToken');

      await usersService.resetPassword(email, resetPasswordUrl);

      expect(findOneMock).toBeCalledTimes(1);
      expect(findOneMock).toBeCalledWith({ where: { email } });

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: '비밀번호를 재설정해주세요 - review site',
        html: `
      <p>안녕하세요, Review Site입니다.</p>
      <p>비밀번호를 재설정하려면 아래 링크를 클릭해주세요.</p>
      <p>링크는 10분 후에 만료됩니다.</p>
      <a href="${resetPasswordUrl}/testToken">
        <button style="
          padding: 10px 20px;
          background-color: #676FA3;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">
          비밀번호 재설정
        </button>
      </a>
      <p>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하시면 됩니다.</p>
      <p>감사합니다.</p>
    `,
      };

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id },
        process.env.SECRET_KEY,
        { expiresIn: '10m' }
      );

      expect(sendMailSpy).toBeCalledTimes(1);
      expect(sendMailSpy).toBeCalledWith(mailOptions);
    });
  });
});
