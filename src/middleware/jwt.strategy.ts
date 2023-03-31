import { NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';

async function decodeToken(token: string): Promise<any> {
  if (!token) {
    return { id: undefined };
  }

  token = token.includes('Bearer') ? token.replace(/^Bearer\s+/, '') : token;
  return jwt.verify(token, process.env.SECRET_KEY || 'MISSING_SECRET_KEY');
}

// 토큰이 없으면 에러를 반환하는 유효성 검사 함수
export async function authValidateOrReject(
  req: Request,
  _: any,
  next: NextFunction
) {
  try {
    const decodedToken = await decodeToken(req.headers.authorization);
    if (!decodedToken.id) {
      throw { status: 401, message: 'INVALID_TOKEN' };
    }
    req.userInfo = { id: decodedToken.id };
    next();
  } catch (err) {
    next(err);
  }
}

// 토큰이 없어도 다음으로 넘어가는 유효성 검사 함수
export async function authValidateOrNext(
  req: Request,
  _: any,
  next: NextFunction
) {
  try {
    const decodedToken = await decodeToken(req.headers.authorization);
    req.userInfo = { id: decodedToken.id };
    next();
  } catch (err) {
    next(err);
  }
}
