import { NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';

async function authMiddleware(req: Request, _: any, next: NextFunction) {
  let token = req.headers.authorization;

  if (!token) {
    throw { status: 401, message: 'TOKEN_DOES_NOT_EXIST' };
  }

  token = token.includes('Bearer') ? token.replace(/^Bearer\s+/, '') : token;
  let decodedToken: any;
  decodedToken = jwt.verify(
    token,
    process.env.SECRET_KEY || 'MISSING_SECRET_KEY'
  );

  req.userInfo = { id: decodedToken.id };
  next();
}

// TODO validteOrReject 추가해서 적용하기
//  접근 불가한 API는 이걸 쓰고, token이 없어도 접근가능한 곳은 다른걸 쓸 수 있도록!

export { authMiddleware };
