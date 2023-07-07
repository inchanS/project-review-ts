import dataSource from '../repositories/data-source';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';

export class CategoriesService {
  private repository: Repository<Category>;

  constructor() {
    this.repository = dataSource.getRepository(Category);
  }

  getCategoriesList = async () => {
    return await this.repository.find({
      select: ['id', 'category', 'description'],
      order: { id: 'ASC' },
    });
  };
}
