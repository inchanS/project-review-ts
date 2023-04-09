import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import searchController from '../controllers/search.controller';
const router = Router();

router.get('', asyncWrap(searchController.searchContent));

export default router;
