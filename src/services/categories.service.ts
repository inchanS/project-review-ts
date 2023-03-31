import dataSource from '../repositories/data-source';
import { Category } from '../entities/category.entity';

const getCategoriesList = async () => {
  return await dataSource.manager.find<Category>('Category', {
    select: ['id', 'category'],
    order: { id: 'ASC' },
  });
};

export default { getCategoriesList };
