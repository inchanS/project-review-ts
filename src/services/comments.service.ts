import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';
import { CommentRepository } from '../repositories/comment.repository';

const getCommentList = async (id: number, userId: number) => {
  const result = await CommentRepository.getCommentList(id);

  return [...result].map((comment: any) => {
    const isPrivate = comment.is_private === true && comment.user.id !== userId;
    const isDeleted = comment.deleted_at !== null;

    return {
      ...comment,
      // 로그인 사용자의 비밀덧글 조회시 유효성 확인 및 삭제된 덧글 필터링
      comment: isDeleted
        ? '## DELETED_COMMENT ##'
        : isPrivate
        ? '## PRIVATE_COMMENT ##'
        : comment.comment,

      // Date 타입의 컬럼에서 불필요한 밀리초 부분 제외
      created_at: comment.created_at.substring(0, 19),
      updated_at: comment.updated_at.substring(0, 19),

      // 삭제된 댓글 처리

      //대댓글 영역 --------------------------------
      children: comment.children.map((child: any) => {
        const isPrivate = child.is_private === true && child.user.id !== userId;
        const isDeleted = child.deleted_at !== null;
        return {
          ...child,

          // 로그인 사용자의 비밀덧글 조회시 유효성 확인 및 삭제된 덧글 필터링
          comment: isDeleted
            ? '## DELETED_COMMENT ##'
            : isPrivate
            ? '## PRIVATE_COMMENT ##'
            : comment.comment,
          // Date 타입의 컬럼에서 불필요한 밀리초 부분 제외
          created_at: child.created_at.substring(0, 19),
          updated_at: child.updated_at.substring(0, 19),
        };
      }),
    };
  });
};

const createComment = async (commentInfo: CommentDto): Promise<void> => {
  commentInfo = plainToInstance(CommentDto, commentInfo);

  await validateOrReject(commentInfo).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });

  await CommentRepository.createComment(commentInfo);
};

// DB에 있는 원 댓글을 찾고 없으면 반환
const validateComment = async (userId: number, commentId: number) => {
  const result = await CommentRepository.findOne({
    loadRelationIds: true,
    where: { id: commentId },
  });

  // typeorm softDelete 메소드를 사용하여 삭제한 경우, delete_at 컬럼의 값이 채워지는데,
  // 이러한 데이터는 typeorm의 find 메소드로 검색시 알아서 null 처리해준다. (console 확인 결과)
  // if (!result || result.deleted_at !== null) {
  //   throw new Error(`ID_${this.commentId}_COMMENT_DOES_NOT_EXIST`);
  // }
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

// 댓글 내용 또는 공개처리에 대한 수정시
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

  // softDelete 데이터가 없을때, 에러를 반환하지 않지만 affected 숫자를 통해 에러처리 할 수 있다.
  // if (result.affected === 0) {
  //   throw new Error(`COULD_NOT_FIND_A_COMMENT_WITH_ID_${commentId}`);
  // }
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
  deleteComment,
  validateComment,
};
