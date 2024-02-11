import { Request, Response } from 'express';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../entities/category.entity';

class CategoriesController {
  private categoriesService: CategoriesService;

  constructor() {
    this.categoriesService = new CategoriesService();
  }

  getCategoriesList = async (_req: Request, res: Response): Promise<void> => {
    const result: Category[] = await this.categoriesService.getCategoriesList();
    res.status(200).json(result);
  };
}

export default new CategoriesController();
