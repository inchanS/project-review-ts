import { NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';

class TokenDecoder {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  public async decodeToken(): Promise<any> {
    if (!this.token) {
      return { id: undefined };
    }

    this.token = this.token.includes('Bearer')
      ? this.token.replace(/^Bearer\s+/, '')
      : this.token;
    return jwt.verify(
      this.token,
      process.env.SECRET_KEY || 'MISSING_SECRET_KEY'
    );
  }
}

class AuthValidator {
  private req: Request;
  private readonly next: NextFunction;

  constructor(req: Request, next: NextFunction) {
    this.req = req;
    this.next = next;
  }

  // 토큰이 없으면 에러를 반환하는 유효성 검사 함수
  public async validateOrReject(): Promise<void> {
    try {
      const decoder: TokenDecoder = new TokenDecoder(
        this.req.headers.authorization as string
      );
      const decodedToken = await decoder.decodeToken();

      if (!decodedToken.id) {
        this.next({ status: 401, message: 'INVALID_TOKEN' });
      }
      this.req.userInfo = { id: decodedToken.id };
    } catch (err) {
      this.next(err);
    }
    this.next();
  }

  // 토큰이 없어도 다음으로 넘어가는 유효성 검사 함수
  public async validateOrNext(): Promise<void> {
    try {
      const decoder: TokenDecoder = new TokenDecoder(
        this.req.headers.authorization as string
      );
      const decodedToken = await decoder.decodeToken();

      this.req.userInfo = { id: decodedToken.id };
    } catch (err) {
      this.next(err);
    }
    this.next();
  }
}
export async function authValidateOrReject(
  req: Request,
  _: any,
  next: NextFunction
): Promise<void> {
  const validator: AuthValidator = new AuthValidator(req, next);
  await validator.validateOrReject();
}

export async function authValidateOrNext(
  req: Request,
  _: any,
  next: NextFunction
): Promise<void> {
  const validator: AuthValidator = new AuthValidator(req, next);
  await validator.validateOrNext();
}
