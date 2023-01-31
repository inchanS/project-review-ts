import { commentListRepository } from '../models/index.repository';

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

export default { getCommentList };
