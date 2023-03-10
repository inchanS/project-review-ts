import commentsService from '../services/comments.service';
import { CommentRepository } from '../repositories/comment.repository';
import { CommentDto } from '../entities/dto/comment.dto';
import dataSource from '../repositories/index.db';

describe('comment.service UNIT test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    await dataSource.initialize().then(() => {
      if (process.env.NODE_ENV === 'test') {
        console.log('💥TEST Data Source has been initialized!');
      }
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  // createComment Unit test
  describe('createComment', () => {
    test('Successful creation of a comment', async () => {
      const commentInfo: CommentDto = {
        user: 1,
        feed: 1,
        comment: 'test comment',
        is_private: false,
      };

      jest.spyOn(CommentRepository, 'createComment').mockResolvedValue();
      await commentsService.createComment(commentInfo);
      expect(CommentRepository.createComment).toBeCalledTimes(1);
    });

    test('Failure: missing comment', async () => {
      const commentInfo: any = { user: 1, feed: 1, is_private: false };

      await expect(
        commentsService.createComment(commentInfo)
      ).rejects.toMatchObject({
        message: {
          isNotEmpty: 'comment should not be empty',
        },
      });
    });

    test('Failure: missing feedId', async () => {
      const commentInfo: any = {
        user: 1,
        comment: 'test comment',
        is_private: false,
      };

      await expect(
        commentsService.createComment(commentInfo)
      ).rejects.toMatchObject({
        message: {
          isNotEmpty: 'feed should not be empty',
        },
      });
    });
  });

  // validateComment Unit test
  describe('validateComment', () => {
    it('should throw error if comment does not exist', async () => {
      jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(null);
      await expect(commentsService.validateComment(1, 1)).rejects.toThrowError(
        'ID_1_COMMENT_DOES_NOT_EXIST'
      );
    });
    it('should throw error if user is not the author', async () => {
      const resultMock: any = { id: 1, user: 2 };
      jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(resultMock);

      await expect(commentsService.validateComment(1, 1)).rejects.toThrowError(
        'ONLY_THE_AUTHOR_CAN_EDIT'
      );
    });

    it('should return comment if validation is successful', async () => {
      const resultMock: any = { id: 1, user: 1 };
      jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(resultMock);
      const comment = await commentsService.validateComment(1, 1);
      expect(comment).toEqual({ id: 1, user: 1 });
    });
  });

  // updateComment Unit test
  describe('updateComment', () => {
    it('should throw error if commentInfo does not changed', async () => {
      const originCommentMock: any = {
        id: 1,
        user: 1,
        is_private: false,
        comment: 'test',
      };

      jest
        .spyOn(CommentRepository, 'findOne')
        .mockResolvedValue(originCommentMock);

      const commentInfo = { comment: 'test', is_private: false };

      await expect(
        commentsService.updateComment(1, 1, commentInfo)
      ).rejects.toThrowError('COMMENT_IS_NOT_CHANGED');
    });

    it("should throw error if commentInfo's comment or is_private is not exits", async () => {
      const originCommentMock: any = {
        id: 1,
        user: 1,
        is_private: false,
        comment: 'test',
      };
      jest
        .spyOn(CommentRepository, 'findOne')
        .mockResolvedValue(originCommentMock);

      const commentInfo: any = { is_private: false };
      await expect(
        commentsService.updateComment(1, 1, commentInfo)
      ).rejects.toThrowError('COMMENT_IS_NOT_CHANGED');

      const commentInfo2: any = { comment: 'test' };
      await expect(
        commentsService.updateComment(1, 1, commentInfo2)
      ).rejects.toThrowError('COMMENT_IS_NOT_CHANGED');

      const commentInfo3: any = { comment: undefined, is_private: undefined };
      await expect(
        commentsService.updateComment(1, 1, commentInfo3)
      ).rejects.toThrowError('COMMENT_IS_NOT_CHANGED');
    });

    it('Success: should return comment if validation is successful', async () => {
      const originCommentMock: any = {
        id: 1,
        user: 1,
        is_private: false,
        comment: 'test',
      };
      jest
        .spyOn(CommentRepository, 'findOne')
        .mockResolvedValue(originCommentMock);
      jest
        .spyOn(CommentRepository, 'updateComment')
        .mockResolvedValue(originCommentMock);

      const commentInfo = { comment: 'test', is_private: true };
      await commentsService.updateComment(1, 1, commentInfo);
      expect(CommentRepository.updateComment).toBeCalledTimes(1);
    });
  });
});
