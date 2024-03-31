import { CategoriesRepository } from '../repositories/categories.repository';
import { Category } from '../entities/category.entity';

export class CategoriesService {
  private repository: CategoriesRepository;

  constructor(categoriesRepository: CategoriesRepository) {
    this.repository = categoriesRepository;
  }

  getCategoriesList = async (): Promise<Category[]> => {
    return await this.repository.find({
      select: ['id', 'category', 'description'],
      order: { id: 'ASC' },
    });
  };
}
