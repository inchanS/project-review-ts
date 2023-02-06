import { commentRepository } from '../models/index.repository';
import { Comment } from '../entities/comment.entity';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';

const getCommentList = async (id: number) => {
  const comments = await commentRepository
    .createQueryBuilder('comment')
    .leftJoinAndSelect('comment.children', 'children')
    .leftJoinAndSelect('comment.user', 'user')
    .orderBy('children.id', 'ASC')
    .getMany();

  return comments;

  // const comment = await dataSource
  //   .createQueryBuilder(Comment, 'comment')
  //   .leftJoinAndSelect('comment.children', 'children')
  //   .leftJoinAndSelect('comment.user', 'user')
  //   .leftJoinAndSelect('children.user', 'user')
  //   .getMany();
  //
  // return comment;

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

  const comment = await commentRepository.create(commentInfo);
  await commentRepository.save(comment);
};

const updateComment = async (commentInfo: Comment) => {
  // await commentReposiroty.update();
};

export default { getCommentList, createComment, updateComment };
