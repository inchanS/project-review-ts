import { CategoriesRepository } from '../repositories/categories.repository';
import { Category } from '../entities/category.entity';

// 카테고리 관련
export class CategoriesService {
  private repository: CategoriesRepository;

  constructor() {
    this.repository = CategoriesRepository.getInstance();
  }

  getCategoriesList = async (): Promise<Category[]> => {
    return await this.repository.find({
      select: ['id', 'category', 'description'],
      order: { id: 'ASC' },
    });
  };
}
