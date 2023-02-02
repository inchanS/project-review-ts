import {
  commentListRepository,
  commentRepository,
} from '../models/index.repository';
import { Comment } from '../entities/comment.entity';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

const getCommentList = async (id: number) => {
  return await commentListRepository
    .find({ where: { feedId: id } })
    .then(value => {
      value = [...value].map((item: any) => {
        return {
          ...item,
          isPrivate: item.isPrivate === 1,
          isDeleted: item.isDeleted === 1,
        };
      });
      return value;
    });
};

const createComment = async (commentInfo: Comment) => {
  commentInfo = plainToInstance(Comment, commentInfo);

  await validateOrReject(commentInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  const comment = await commentRepository.create(commentInfo);
  await commentRepository.save(comment);
};

const updateComment = async (commentInfo: Comment) => {
  // await commentReposiroty.update();
};

export default { getCommentList, createComment, updateComment };
