import { Router } from 'express';
import { asyncWrap } from '../utils/util';
import symbolsController from '../controllers/symbols.controller';
import { authValidateOrReject } from '../middleware/jwt.strategy';
const router = Router();

router.get('', asyncWrap(symbolsController.getSymbols));
router.get('/:feedId', asyncWrap(symbolsController.getFeedSymbolCount));
router.get(
  '/check/:feedId',
  asyncWrap(authValidateOrReject),
  asyncWrap(symbolsController.checkUsersSymbolForfeed)
);
router.post(
  '/:feedId',
  asyncWrap(authValidateOrReject),
  asyncWrap(symbolsController.addAndUpdateSymbolToFeed)
);
router.delete(
  '/:feedId',
  asyncWrap(authValidateOrReject),
  asyncWrap(symbolsController.removeSymbolFromFeed)
);
export default router;
