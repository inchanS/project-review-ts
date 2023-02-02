import {
  commentListRepository,
  commentReposiroty,
} from '../models/index.repository';
import { Comment } from '../entities/comment.entity';
import { plainToClass } from 'class-transformer';
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
  commentInfo = plainToClass(Comment, commentInfo);

  await validateOrReject(commentInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  const comment = await commentReposiroty.create(commentInfo);
  await commentReposiroty.save(comment);
};

export default { getCommentList, createComment };
