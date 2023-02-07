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

const createComment = async (commentInfo: CommentDto): Promise<void> => {
  commentInfo = plainToInstance(CommentDto, commentInfo);

  await validateOrReject(commentInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await CommentRepository.createComment(commentInfo);
};

// 댓글 내용 또는 공개처리에 대한 수정시
const updateComment = async (
  userId: number,
  commentId: number,
  commentInfo: CommentDto
): Promise<void> => {
  const originComment = await CommentRepository.findOne({
    loadRelationIds: true,
    where: { id: commentId },
  });

  // commentInfo에서 내용 생략시, 원문 내용으로 채우기
  if (commentInfo.is_private === undefined) {
    commentInfo.is_private = originComment.is_private;
  }
  if (commentInfo.comment === undefined) {
    commentInfo.comment = originComment.comment;
  }

  // 작성자 아이디가 다를 때 에러처리
  if (userId !== originComment.user.id) {
    const error = new Error(`ONLY_THE_AUTHOR_CAN_EDIT`);
    error.status = 401;
    throw error;
  }

  // 변경사항이 없을 때 에러반환
  if (
    commentInfo.comment === originComment.comment &&
    commentInfo.is_private === originComment.is_private
  ) {
    const error = new Error(`COMMENT_IS_NOT_CHANGED`);
    error.status = 405;
    throw error;
  }

  await CommentRepository.updateComment(commentId, commentInfo);
};

// 작성자 id별 작성한 댓글 모두 가져오기
const getCommentsById = async (userId: number) => {
  return await CommentRepository.getCommentListByUserId(userId);
};
export default {
  getCommentList,
  createComment,
  updateComment,
  getCommentsById,
};
