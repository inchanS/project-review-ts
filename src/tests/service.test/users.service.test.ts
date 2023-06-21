import { User } from '../../entities/users.entity';
import usersService from '../../services/users.service';
import { UserDto } from '../../entities/dto/user.dto';
import { UserRepository } from '../../repositories/user.repository';
import bcrypt from 'bcryptjs';
import { Feed } from '../../entities/feed.entity';
import {
  FeedListRepository,
  Pagination,
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

describe('USERS UNIT test', () => {
  describe('checkDuplicateNickname', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    test('닉네임이 undefined 일 때, 에러 반환', async () => {
      const nickname: string = undefined;

      await expect(
        usersService.checkDuplicateNickname(nickname)
      ).rejects.toThrowError('NICKNAME_IS_UNDEFINED');
    });

    test('닉네임 중복이 아닐 때, 성공', async () => {
      const nickname: string = 'newNickname';

      jest.spyOn(User, 'findByNickname').mockResolvedValueOnce(null);

      const result = await usersService.checkDuplicateNickname(nickname);

      expect(result).toEqual({ message: 'AVAILABLE_NICKNAME' });
      expect(User.findByNickname).toBeCalledTimes(1);
      expect(User.findByNickname).toBeCalledWith(nickname);
    });

    test('닉네임이 중복일 때, 에러 반환', async () => {
      const nickname: string = 'nickname';

      const user = new User();
      user.nickname = 'nickname';

      jest.spyOn(User, 'findByNickname').mockResolvedValueOnce(user);

      await expect(
        usersService.checkDuplicateNickname(nickname)
      ).rejects.toThrowError('nickname_IS_NICKNAME_THAT_ALREADY_EXSITS');
    });
  });

  describe('checkDuplicateEmail', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    test('이메일이 undefined 일 때, 에러 반환', async () => {
      const email: string = undefined;
      await expect(
        usersService.checkDuplicateEmail(email)
      ).rejects.toThrowError('EMAIL_IS_UNDEFINED');
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

      const user = new User();
      user.email = 'email';

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(user);

      await expect(
        usersService.checkDuplicateEmail(email)
      ).rejects.toThrowError('email_IS_EMAIL_THAT_ALREADY_EXSITS');
    });
  });

  describe('signUp', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    test('이메일 형식이 아닐 때, 에러 반환', async () => {
      const userInfo: UserDto = {
        email: 'email',
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

    test('패스워드 형식이 아닐 때, 에러 반환', async () => {
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

      expect(mockFindByEmail).toBeCalledTimes(1);
      expect(mockFindByEmail).toBeCalledWith(userInfo.email);
      expect(mockFindByNickname).toBeCalledTimes(1);
      expect(mockFindByNickname).toBeCalledWith(userInfo.nickname);
      expect(mockCreateUser).toBeCalledTimes(1);
      expect(mockCreateUser).toBeCalledWith(userInfo);
    });
  });

  describe('signIn', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    test('사용자 중 해당 이메일을 찾을 수 없을 때, 에러반환', async () => {
      const email: string = 'email';
      const password: string = 'password';

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(null);

      await expect(usersService.signIn(email, password)).rejects.toEqual({
        status: 404,
        message: 'email_IS_NOT_FOUND',
      });
    });

    test('비밀번호가 일치하지 않을 때, 에러반환', async () => {
      const email: string = 'email';
      const password: string = 'password';

      const user = new User();
      user.password = 'password2';

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(user);

      await expect(usersService.signIn(email, password)).rejects.toEqual({
        status: 401,
        message: 'PASSWORD_IS_INCORRECT',
      });
    });

    test('로그인 성공', async () => {
      const email: string = 'email';
      const password: string = 'password';

      const genSalt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, genSalt);

      const user = new User();
      user.password = hashedPassword;

      jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(user);

      const result = await usersService.signIn(email, password);
      expect(result).toHaveProperty('token');
    });
  });

  describe('findUserInfoById', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('사용자를 찾을 수 없을 때, 에러반환', async () => {
      const userId: number = 1;

      jest.spyOn(UserRepository, 'findOne').mockResolvedValueOnce(null);

      try {
        await usersService.findUserInfoByUserId(userId);
      } catch (error: any) {
        expect(error.status).toEqual(404);
        expect(error.message).toEqual('USER_IS_NOT_FOUND');
      }
    });

    test('사용자를 찾을 수 있을 때, 성공', async () => {
      const userId: number = 1;

      const user = new User();
      user.id = userId;

      jest.spyOn(UserRepository, 'findOne').mockResolvedValue(user);

      const result = await usersService.findUserInfoByUserId(userId);

      // 함수 과정 확인
      expect(UserRepository.findOne).toBeCalledTimes(1);
      expect(UserRepository.findOne).toBeCalledWith({ where: { id: userId } });

      // 함수 결과물 형식 확인
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('id');
      expect(result.id).toEqual(userId);
      expect(result.password).toEqual(undefined);
      expect(result).toHaveProperty('email');
      expect(result.email).toEqual(user.email);
      expect(result).toHaveProperty('nickname');
      expect(result.nickname).toEqual(user.nickname);
    });
  });

  describe('findUserFeedsByUserId', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    const userId: number = 1;
    const user = new User();
    user.id = userId;

    const feed = new Feed();
    feed.id = 1;
    feed.user = user;
    feed.title = 'title';
    feed.content = 'content';
    feed.created_at = new Date();
    feed.updated_at = new Date();

    const feedList: Feed[] = [feed];

    test('사용자의 게시물 반환 성공', async () => {
      jest
        .spyOn(FeedListRepository, 'getFeedListByUserId')
        .mockResolvedValueOnce(feedList);

      const pageParam: Pagination = { startIndex: 1, limit: 10 };

      const result = await usersService.findUserFeedsByUserId(
        userId,
        pageParam
      );

      // 함수 과정 확인
      expect(FeedListRepository.getFeedListByUserId).toBeCalledTimes(1);
      expect(FeedListRepository.getFeedListByUserId).toBeCalledWith(
        userId,
        pageParam,
        undefined
      );

      // 함수 결과물 형식 확인
      expect(result).toBeDefined();
      expect(result).toEqual(feedList);
    });

    test('userId가 전달되지 않았을 때, 에러메세지 반환', async () => {
      try {
        await usersService.findUserFeedsByUserId(undefined, undefined);
      } catch (error: any) {
        expect(error.status).toEqual(400);
        expect(error.message).toEqual('USER_ID_IS_UNDEFINED');
      }
    });

    test('잘못된 startIndex query가 전달되었을 때, 에러메세지 반환', async () => {
      const pageParam: Pagination = { startIndex: 0, limit: 10 };

      try {
        await usersService.findUserFeedsByUserId(userId, pageParam);
      } catch (error: any) {
        expect(error.status).toEqual(400);
        expect(error.message).toEqual('PAGE_START_INDEX_IS_INVALID');
      }
    });
  });

  describe('findUserCommentsByUserId', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    let mockGetCommentListByUserId: Comment[] = [];

    // 비공개 및 삭제 댓글의 내용을 걸러주는지 확인하기 위한 mock data
    // mySQL에서 출력되는 Date타입의 String 형식
    const dateToString: string = '2021-01-01T00:00:00.000Z';

    const userId: number = 1;

    // 본인 아이디
    const user = new User();
    user.id = userId;

    const mockFeedUser = new User();
    mockFeedUser.id = 10;

    const mockFeed = new Feed();
    mockFeed.id = 1;
    mockFeed.user = mockFeedUser;

    const privateMyComment: any = new Comment();
    privateMyComment.id = 1;
    privateMyComment.comment = 'content';
    privateMyComment.user = user;
    privateMyComment.is_private = true;
    privateMyComment.created_at = dateToString;
    privateMyComment.updated_at = dateToString;
    privateMyComment.deleted_at = null;
    privateMyComment.feed = mockFeed;

    const user2 = new User();
    user2.id = 2;
    const publicOtherComment: any = new Comment();
    publicOtherComment.id = 2;
    publicOtherComment.comment = 'content';
    publicOtherComment.user = user2;
    publicOtherComment.is_private = false;
    publicOtherComment.created_at = dateToString;
    publicOtherComment.updated_at = dateToString;
    publicOtherComment.deleted_at = null;
    publicOtherComment.feed = mockFeed;

    const user3 = new User();
    user3.id = 3;
    const privateOtherComment: any = new Comment();
    privateOtherComment.id = 3;
    privateOtherComment.comment = 'content';
    privateOtherComment.user = user3;
    privateOtherComment.is_private = true;
    privateOtherComment.created_at = dateToString;
    privateOtherComment.updated_at = dateToString;
    privateOtherComment.deleted_at = null;
    privateOtherComment.feed = mockFeed;

    const deletedMyComment: any = new Comment();
    deletedMyComment.id = 4;
    deletedMyComment.comment = 'content';
    deletedMyComment.user = user;
    deletedMyComment.is_private = false;
    deletedMyComment.created_at = dateToString;
    deletedMyComment.updated_at = dateToString;
    deletedMyComment.deleted_at = dateToString;
    deletedMyComment.feed = mockFeed;

    mockGetCommentListByUserId.push(
      privateMyComment,
      publicOtherComment,
      privateOtherComment,
      deletedMyComment
    );

    test('userId 전달이 없을 때, 에러 반환', async () => {
      try {
        await usersService.findUserCommentsByUserId(undefined, undefined);
      } catch (error: any) {
        expect(error.status).toEqual(400);
        expect(error.message).toEqual('USER_ID_IS_UNDEFINED');
      }
    });

    test('사용자의 덧글 목록 반환 성공', async () => {
      jest
        .spyOn(CommentRepository, 'getCommentListByUserId')
        .mockResolvedValueOnce(mockGetCommentListByUserId);

      const pageParam: Pagination = { startIndex: 0, limit: 10 };

      const mockCommentCnt: number = 4;

      jest
        .spyOn(CommentRepository, 'getCommentCountByUserId')
        .mockResolvedValue(mockCommentCnt);

      const result: any = await usersService.findUserCommentsByUserId(
        userId,
        userId,
        pageParam
      );

      // 함수 과정 확인
      expect(CommentRepository.getCommentListByUserId).toBeCalledTimes(1);
      expect(CommentRepository.getCommentListByUserId).toBeCalledWith(
        userId,
        pageParam
      );

      // 함수 결과물 형식 확인
      expect(result).toBeDefined();
      expect(result.totalScrollCnt).toEqual(1);
      expect(result.commentListByUserId).toHaveLength(4);

      // 본인의 비공개 댓글은 반환
      expect(result.commentListByUserId[0].comment).toEqual('content');

      // 다른 사람의 공개 댓글은 반환
      expect(result.commentListByUserId[1].comment).toEqual('content');

      // 다른 사람의 비공개 댓글은 반환하지 않음
      expect(result.commentListByUserId[2].comment).toEqual(
        '## PRIVATE_COMMENT ##'
      );

      // 본인의 삭제 댓글은 반환하지 않음
      expect(result.commentListByUserId[3].comment).toEqual(
        '## DELETED_COMMENT ##'
      );
      // Date 타입 재가공 확인
      expect(result.commentListByUserId[0].created_at).toEqual(
        dateToString.substring(0, 19)
      );
      expect(result.commentListByUserId[0].updated_at).toEqual(
        dateToString.substring(0, 19)
      );
    });
  });

  describe('findUserFeedSymbolsByUserId', () => {
    let queryBuilder: any;

    beforeEach(() => {
      jest.clearAllMocks();

      queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockReturnValueOnce([]),
      };

      jest
        .spyOn(dataSource.manager, 'createQueryBuilder')
        .mockReturnValue(queryBuilder);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    const userId: number = 1;

    test('userId 전달이 없을 때, 에러 반환', async () => {
      const pageParam: Pagination = { startIndex: 0, limit: 10 };

      await expect(
        usersService.findUserFeedSymbolsByUserId(undefined, pageParam)
      ).rejects.toEqual({
        status: 400,
        message: 'USER_ID_IS_UNDEFINED',
      });
    });

    test('잘못된 startIndex query 전달시 에러 반환 ', async () => {
      const pageParam: Pagination = { startIndex: 0, limit: 1 };

      await expect(
        usersService.findUserFeedSymbolsByUserId(userId, pageParam)
      ).rejects.toEqual({
        status: 400,
        message: 'PAGE_START_INDEX_IS_INVALID',
      });
    });

    test('findUserFeedSymbolsByUserId 성공', async () => {
      const pageParam: Pagination = { startIndex: 1, limit: 10 };

      const result = await usersService.findUserFeedSymbolsByUserId(
        userId,
        pageParam
      );

      expect(result).toBeDefined();
      expect(queryBuilder.select).toBeCalledTimes(1);
      expect(queryBuilder.where).toBeCalledWith('user.id = :userId', {
        userId,
      });
      expect(queryBuilder.skip).toBeCalledWith(pageParam.startIndex - 1);
      expect(queryBuilder.take).toBeCalledWith(pageParam.limit);
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
