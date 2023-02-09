import commentsService from '../services/comments.service';
import { CommentRepository } from '../repositories/comment.repository';
import { CommentDto } from '../entities/dto/comment.dto';
import dataSource from '../repositories/index.db';

// const dataSource = new DataSource({
//   type: process.env.TYPEORM_CONNECTION,
//   host: process.env.TYPEORM_HOST,
//   port: process.env.TYPEORM_PORT,
//   username: process.env.TYPEORM_USERNAME,
//   password: process.env.TYPEORM_PASSWORD,
//   database: process.env.TYPEORM_DATABASE,
//   timezone: 'Z',
//   entities: [__dirname + '/../**/*.entity.{js,ts}'],
//   logging: Boolean(process.env.TYPEORM_LOGGING),
//   synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
// });

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
        console.log('💥TEST Data Source has been initialized!💥');
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
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw error if comment does not exist', async () => {
      jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(null);
      await expect(commentsService.validateComment(1, 1)).rejects.toThrowError(
        'ID_1_COMMENT_DOES_NOT_EXIST'
      );
    });
    it('should throw error if user is not the author', async () => {
      const result: any = { id: 1, user: 2 };
      jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(result);

      await expect(commentsService.validateComment(1, 1)).rejects.toThrowError(
        'ONLY_THE_AUTHOR_CAN_EDIT'
      );
    });

    it('should return comment if validation is successful', async () => {
      const result: any = { id: 1, user: 1 };
      jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(result);
      const comment = await commentsService.validateComment(1, 1);
      expect(comment).toEqual({ id: 1, user: 1 });
    });
  });

  // updateComment Unit test
  describe('updateComment', () => {
    test('Successful update of a comment', async () => {
      // FIXME : validateComment class 추가된 commentService 변경내역 반영하기
      const userId = 1;
      const commentId = 1;
      const commentInfo: CommentDto = {
        comment: 'update comment',
        is_private: false,
      };

      const originComment: any = {
        user: { id: 1 },
        comment: 'origin comment',
        is_private: false,
      };
      jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(originComment);
      jest.spyOn(CommentRepository, 'updateComment').mockResolvedValue();

      await commentsService.updateComment(userId, commentId, commentInfo);
      expect(CommentRepository.updateComment).toBeCalledTimes(1);
    });
  });
});
