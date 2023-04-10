import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import searchController from '../controllers/search.controller';
const router = Router();

// 검색창에서 사용하는 용도
router.get('', asyncWrap(searchController.searchContent));

// 검색창에서 전체 검색목록을 볼때 사용하는 용도
router.get('/list', asyncWrap(searchController.searchContentList));

export default router;
