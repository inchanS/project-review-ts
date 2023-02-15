import { Request, Response } from 'express';
import categoriesService from '../services/categories.service';

const getCategoriesList = async (req: Request, res: Response) => {
  const result = await categoriesService.getCategoriesList();
  res.status(200).json(result);
};

export default { getCategoriesList };
