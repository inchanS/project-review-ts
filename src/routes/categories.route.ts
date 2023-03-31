import { Router } from 'express';
import categoriesController from '../controllers/categories.controller';
import { asyncWrap } from '../utils/util';

const router = Router();

router.get('', asyncWrap(categoriesController.getCategoriesList));

export default router;
