import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import symbolsController from '../controllers/symbols.controller';
import { authValidateOrReject } from '../middleware/jwt.strategy';
const router = Router();

// symbol 조회하기
router.get('', asyncWrap(symbolsController.getSymbols));

// feedId에 해당하는 symbol 종류별 갯수 조회하기
router.get('/:feedId', asyncWrap(symbolsController.getFeedSymbolCount));

// symbol 추가 및 변경하기
router.post(
  '/:feedId',
  asyncWrap(authValidateOrReject),
  asyncWrap(symbolsController.addAndUpdateSymbolToFeed)
);

// symbol 삭제하기
router.delete(
  '/:feedId',
  asyncWrap(authValidateOrReject),
  asyncWrap(symbolsController.removeSymbolFromFeed)
);

// 사용자가 해당 feedId에 symbol을 추가했는지 조회하기
router.get(
  '/check/:feedId',
  asyncWrap(authValidateOrReject),
  asyncWrap(symbolsController.checkUsersSymbolForFeed)
);

export default router;
