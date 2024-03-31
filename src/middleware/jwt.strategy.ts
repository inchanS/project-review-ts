import { NextFunction, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ValidatorService } from '../services/users/validator.service';
import { CustomError } from '../utils/util';
import { createValidateService } from '../utils/serviceFactory';

class TokenDecoder {
  public static async decodeToken(token: string): Promise<JwtPayload | string> {
    try {
      token = token.includes('Bearer')
        ? token.replace(/^Bearer\s+/, '')
        : token;

      return jwt.verify(token, process.env.SECRET_KEY || 'MISSING_SECRET_KEY');
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        throw new CustomError(401, 'INVALID_TOKEN');
      } else if (err instanceof jwt.TokenExpiredError) {
        throw new CustomError(401, 'TOKEN_HAS_EXPIRED');
      } else {
        throw new CustomError(
          401,
          'AN_ERROR_OCCURRED_WHILE_DECODING_THE_TOKEN'
        );
      }
    }
  }
}

class AuthValidator {
  private req: Request;
  private readonly next: NextFunction;
  private readonly validatorService: ValidatorService;

  constructor(req: Request, next: NextFunction) {
    this.req = req;
    this.next = next;
    this.validatorService = createValidateService();
  }

  // 토큰이 없으면 에러를 반환하는 유효성 검사 함수
  public async validateOrReject(): Promise<void> {
    try {
      const token: string | undefined = this.req.headers.authorization;

      if (!token) {
        throw new CustomError(401, 'NOT_FOUND_AUTHORIZATION');
      } else {
        const decodedToken: JwtPayload | string =
          await TokenDecoder.decodeToken(token);

        if (
          typeof decodedToken === 'object' &&
          'id' in decodedToken &&
          typeof decodedToken.id === 'number'
        ) {
          // decodedToken.id가 현재 시점에도 유효한지 검사하는 로직
          await this.validatorService.validateUserInfo(decodedToken.id);

          this.req.userInfo = { id: decodedToken.id };
          this.next();
        } else {
          throw new CustomError(401, 'INVALID_TOKEN_STRUCTURE');
        }
      }
    } catch (err) {
      this.next(err);
    }
  }

  // 토큰이 없어도 다음으로 넘어가는 유효성 검사 함수
  public async validateOrNext(): Promise<void> {
    try {
      const token: string | undefined = this.req.headers.authorization;

      if (!token) {
        this.next();
      } else {
        const decodedToken: JwtPayload | string =
          await TokenDecoder.decodeToken(token);

        if (
          typeof decodedToken === 'object' &&
          decodedToken.hasOwnProperty('id') &&
          typeof decodedToken.id === 'number'
        ) {
          // decodedToken.id가 현재 시점에도 유효한지 검사하는 로직
          const userId: number = decodedToken.id;
          await this.validatorService.validateUserInfo(userId);

          this.req.userInfo = { id: userId };
        } else {
          throw new CustomError(401, 'INVALID_TOKEN_STRUCTURE');
        }
        this.next();
      }
    } catch (err) {
      this.next(err);
    }
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
