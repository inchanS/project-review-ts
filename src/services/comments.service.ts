import { Comment } from '../entities/comment.entity';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentRepository } from '../repositories/comment.repository';

const getCommentList = async (id: number) => {
  return await CommentRepository.getCommentList(id);

  // return await commentListRepository
  //   .find({ where: { feedId: id } })
  //   .then(value => {
  //     value = [...value].map((item: any) => {
  //       return {
  //         ...item,
  //         isPrivate: item.isPrivate === 1,
  //         isDeleted: item.isDeleted === 1,
  //       };
  //     });
  //     return value;
  //   });
};

const createComment = async (commentInfo: CommentDto) => {
  commentInfo = plainToInstance(CommentDto, commentInfo);

  await validateOrReject(commentInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await CommentRepository.createComment(commentInfo);
};

const updateComment = async (commentInfo: Comment) => {};

const getCommentsById = async (userId: number) => {
  return await CommentRepository.getCommentListByUserId(userId);
};
export default {
  getCommentList,
  createComment,
  updateComment,
  getCommentsById,
};
