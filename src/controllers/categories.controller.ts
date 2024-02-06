import { Request, Response } from 'express';
import { CategoriesService } from '../services/categories.service';

class CategoriesController {
  private categoriesService: CategoriesService;

  constructor() {
    this.categoriesService = new CategoriesService();
  }

  getCategoriesList = async (req: Request, res: Response): Promise<void> => {
    const result = await this.categoriesService.getCategoriesList();
    res.status(200).json(result);
  };
}

export default new CategoriesController();
