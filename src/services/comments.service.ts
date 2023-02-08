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

// 덧글 수정, 삭제시 원본과 확인하는 클래스기반 함수
class ValidateOriginComment {
  userId: number;
  commentId: number;
  constructor(userId: number, commentId: number) {
    this.userId = userId;
    this.commentId = commentId;
  }

  // DB에 있는 원 댓글을 찾고 없으면 반환
  async originComment() {
    const result = await CommentRepository.findOne({
      loadRelationIds: true,
      where: { id: this.commentId },
    });

    // typeorm softDelete 메소드를 사용하여 삭제한 경우, delete_at 컬럼의 값이 채워지는데,
    // 이러한 데이터는 typeorm의 find 메소드로 검색시 알아서 null 처리해준다. (console 확인 결과)
    // if (!result || result.deleted_at !== null) {
    //   throw new Error(`ID_${this.commentId}_COMMENT_DOES_NOT_EXIST`);
    // }

    if (!result) {
      throw new Error(`ID_${this.commentId}_COMMENT_DOES_NOT_EXIST`);
    }
    return result;
  }

  // 작성자 아이디가 다를 때 에러처리
  async checkCommentWriter() {
    const originComment = await this.originComment();
    if (this.userId !== Number(originComment.user)) {
      const error = new Error(`ONLY_THE_AUTHOR_CAN_EDIT`);
      error.status = 401;
      throw error;
    }
  }
}

// 댓글 내용 또는 공개처리에 대한 수정시
const updateComment = async (
  userId: number,
  commentId: number,
  commentInfo: CommentDto
): Promise<void> => {
  // 원래 댓글 데이터 유효성검사
  const db = new ValidateOriginComment(userId, commentId);
  const origin = await db.originComment();
  await db.checkCommentWriter();

  // commentInfo에서 내용 생략시, 원문 내용으로 채우기
  if (commentInfo.is_private === undefined) {
    commentInfo.is_private = origin.is_private;
  }
  if (commentInfo.comment === undefined) {
    commentInfo.comment = origin.comment;
  }

  // 변경사항이 없을 때 에러반환
  if (
    commentInfo.comment === origin.comment &&
    commentInfo.is_private === origin.is_private
  ) {
    const error = new Error(`COMMENT_IS_NOT_CHANGED`);
    error.status = 405;
    throw error;
  }

  await CommentRepository.updateComment(commentId, commentInfo);
};

const deleteComment = async (commentId: number, userId: number) => {
  // 원댓글 유효성 검사
  const db = new ValidateOriginComment(userId, commentId);
  await db.originComment();
  await db.checkCommentWriter();

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
};
