import { Request, Response } from 'express';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../entities/category.entity';
import { createCategoriesService } from '../utils/serviceFactory';

class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  getCategoriesList = async (_req: Request, res: Response): Promise<void> => {
    const result: Category[] = await this.categoriesService.getCategoriesList();
    res.status(200).json(result);
  };
}

export default new CategoriesController(createCategoriesService());
