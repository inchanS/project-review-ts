import dataSource from '../repositories/index.db';
import { Category } from '../entities/category.entity';

const getCategoriesList = async () => {
  return await dataSource.manager.find<Category>('Category', {
    select: ['id', 'category'],
    order: { id: 'ASC' },
  });
};

export default { getCategoriesList };
