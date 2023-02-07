import commentsService from '../services/comments.service';
import { DataSource } from 'typeorm';
import { CommentRepository } from '../repositories/comment.repository';
import { CommentDto } from '../entities/dto/comment.dto';

const dataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  timezone: 'Z',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  logging: Boolean(process.env.TYPEORM_LOGGING),
  synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
});
describe('comment.service UNIT test', () => {
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
  test('createComment - Success', async () => {
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

  test('createComment - Fail: without comment', async () => {
    const commentInfo: any = { user: 1, feed: 1, is_private: false };

    await expect(
      commentsService.createComment(commentInfo)
    ).rejects.toMatchObject({
      message: {
        isNotEmpty: 'comment should not be empty',
      },
    });
  });

  test('createComment - Fail: without feedId', async () => {
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

  // updateComment Unit test
  test('updateComment - Success', async () => {
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
