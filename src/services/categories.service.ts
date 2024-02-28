import { CategoriesRepository } from '../repositories/categories.repository';

export class CategoriesService {
  private repository: CategoriesRepository;

  constructor() {
    this.repository = CategoriesRepository.getInstance();
  }

  getCategoriesList = async () => {
    return await this.repository.find({
      select: ['id', 'category', 'description'],
      order: { id: 'ASC' },
    });
  };
}
