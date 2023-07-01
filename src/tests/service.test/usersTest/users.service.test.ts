import { User } from '../../../entities/users.entity';
import { UserDto } from '../../../entities/dto/user.dto';
import { UserRepository } from '../../../repositories/user.repository';
import { Feed } from '../../../entities/feed.entity';
import { FeedListRepository } from '../../../repositories/feed.repository';
import { Comment } from '../../../entities/comment.entity';
import { CommentRepository } from '../../../repositories/comment.repository';
import dataSource from '../../../repositories/data-source';
import UploadFileService, {
  DeleteUploadFiles,
} from '../../../services/uploadFile.service';
import { FeedSymbol } from '../../../entities/feedSymbol.entity';
import userService from '../../../services/users/user.service';

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

    jest.spyOn(UserRepository, 'findOne').mockResolvedValueOnce(originUserInfo);

    try {
      await userService.updateUserInfo(userId, updateUserInfoDto);
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

    jest.spyOn(UserRepository, 'findOne').mockResolvedValueOnce(originUserInfo);

    jest.spyOn(User, 'findByEmail').mockResolvedValueOnce(null);

    jest.spyOn(UserRepository, 'update').mockResolvedValueOnce(null);

    jest
      .spyOn(UserRepository, 'findOne')
      .mockResolvedValueOnce(updatedUserInfo);

    const result = await userService.updateUserInfo(userId, updateUserInfoDto);

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
      await userService.deleteUser(userId);
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

      jest.spyOn(dataSource.manager, 'find').mockResolvedValue(mockUserSymbols);

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

      const result = await userService.deleteUser(userId);

      // 함수 과정 확인
      expect(UserRepository.findOne).toBeCalledTimes(1);
      expect(UserRepository.findOne).toBeCalledWith({
        where: { id: userId },
      });

      expect(queryRunnerMock().manager.softDelete).toBeCalledTimes(4);
      expect(queryRunnerMock().manager.softDelete).toBeCalledWith(User, userId);

      expect(result).toBeUndefined();
      // user 삭제 과정의 함수 확인
      expect(queryRunnerMock().manager.softDelete).toBeCalledWith(User, 1);
      // feed 삭제 과정의 함수 확인
      expect(queryRunnerMock().manager.softDelete).toBeCalledWith(Feed, [1, 2]);
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

      const result = await userService.deleteUser(userId);

      // 함수 과정 확인
      expect(UserRepository.findOne).toBeCalledTimes(1);
      expect(UserRepository.findOne).toBeCalledWith({
        where: { id: userId },
      });

      expect(queryRunnerMock().manager.softDelete).toBeCalledTimes(3);
      expect(queryRunnerMock().manager.softDelete).toBeCalledWith(User, userId);

      expect(result).toBeUndefined();
    });
  });
});
