import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentRepository } from '../repositories/comment.repository';

// 무한 대댓글의 경우, 재귀적으로 호출되는 함수
const formatComment = (comment: any, userId: number): any => {
  // 로그인 사용자의 비밀덧글 조회시 유효성 확인 및 삭제된 덧글 필터링
  // TODO 비밀덧글 조회시, 게시글작성자와 원댓글 작성자만 조회가능하도록 수정
  const isPrivate = comment.is_private === true && comment.user.id !== userId;
  const isDeleted = comment.deleted_at !== null;
  const formattedComment = {
    ...comment,
    comment: isDeleted
      ? '## DELETED_COMMENT ##'
      : isPrivate
      ? '## PRIVATE_COMMENT ##'
      : comment.comment,

    // Date 타입의 컬럼에서 불필요한 밀리초 부분 제외
    created_at: comment.created_at.substring(0, 19),
    updated_at: comment.updated_at.substring(0, 19),
    deleted_at: comment.deleted_at ? comment.deleted_at.substring(0, 19) : null,

    // 대댓글 영역
    children: comment.children
      ? comment.children.map((child: any) => formatComment(child, userId))
      : [],
  };
  /**/
  return formattedComment;
};

const getCommentList = async (id: number, userId: number) => {
  const result = await CommentRepository.getCommentList(id);

  const formattedResult = [...result].map((comment: any) =>
    formatComment(comment, userId)
  );

  return formattedResult;
};

const createComment = async (commentInfo: CommentDto): Promise<void> => {
  commentInfo = plainToInstance(CommentDto, commentInfo);

  await validateOrReject(commentInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await CommentRepository.createComment(commentInfo);
};

const validateComment = async (userId: number, commentId: number) => {
  const result = await CommentRepository.findOne({
    loadRelationIds: true,
    where: { id: commentId },
  });

  if (!result) {
    throw new Error(`ID_${commentId}_COMMENT_DOES_NOT_EXIST`);
  }

  // 작성자 아이디가 다를 때 에러처리
  if (userId !== Number(result.user)) {
    const error = new Error(`ONLY_THE_AUTHOR_CAN_EDIT`);
    error.status = 401;
    throw error;
  }

  return result;
};

const updateComment = async (
  userId: number,
  commentId: number,
  commentInfo: CommentDto
): Promise<void> => {
  const originComment = await validateComment(userId, commentId);

  // commentInfo에서 내용 생략시, 원문 내용으로 채우기
  if (commentInfo.is_private === undefined) {
    commentInfo.is_private = originComment.is_private;
  }
  if (commentInfo.comment === undefined) {
    commentInfo.comment = originComment.comment;
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

const deleteComment = async (commentId: number, userId: number) => {
  // 원댓글 유효성 검사
  await validateComment(userId, commentId);

  await CommentRepository.softDelete(commentId);
};

const getCommentsById = async (userId: number) => {
  return await CommentRepository.getCommentListByUserId(userId);
};
export default {
  getCommentList,
  createComment,
  updateComment,
  getCommentsById,
  deleteComment,
  validateComment,
};
