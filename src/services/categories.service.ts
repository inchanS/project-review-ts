import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';

// 카테고리 관련
export class CategoriesService {
  constructor(private categoryRepository: Repository<Category>) {
    this.categoryRepository = categoryRepository;
  }

  getCategoriesList = async (): Promise<Category[]> => {
    return await this.categoryRepository.find({
      select: ['id', 'category', 'description'],
      order: { id: 'ASC' },
    });
  };
}
