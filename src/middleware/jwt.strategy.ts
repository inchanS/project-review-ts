import { NextFunction, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ValidatorService } from '../services/users/validator.service';

class TokenDecoder {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  public async decodeToken(): Promise<{ id: undefined } | JwtPayload | string> {
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
  private readonly validatorService: ValidatorService;

  constructor(req: Request, next: NextFunction) {
    this.req = req;
    this.next = next;
    this.validatorService = new ValidatorService();
  }

  // 토큰이 없으면 에러를 반환하는 유효성 검사 함수
  public async validateOrReject(): Promise<void> {
    try {
      const decoder: TokenDecoder = new TokenDecoder(
        this.req.headers.authorization as string
      );
      const decodedToken: { id: undefined } | JwtPayload | string =
        await decoder.decodeToken();

      if (
        typeof decodedToken === 'object' &&
        'id' in decodedToken &&
        decodedToken.id === 'number'
      ) {
        // decodedToken.id가 현재 시점에도 유효한지 검사하는 로직
        await this.validatorService.validateUserInfo(decodedToken.id);

        this.req.userInfo = { id: decodedToken.id };
      } else {
        this.next({ status: 401, message: 'INVALID_TOKEN' });
      }
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

      const decodedToken: { id: undefined } | JwtPayload | string =
        await decoder.decodeToken();

      if (
        typeof decodedToken === 'object' &&
        decodedToken.hasOwnProperty('id') &&
        decodedToken.id !== undefined
      ) {
        // decodedToken.id가 현재 시점에도 유효한지 검사하는 로직
        await this.validatorService.validateUserInfo(decodedToken.id);

        this.req.userInfo = { id: decodedToken.id };
      }
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
