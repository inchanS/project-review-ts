import { Router } from 'express';
import CategoriesController from '../controllers/categories.controller';
import { asyncWrap } from '../utils/util';

const router: Router = Router();

router.get('', asyncWrap(CategoriesController.getCategoriesList));

export default router;
