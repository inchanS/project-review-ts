import express, { NextFunction, Request, Response } from 'express';
import { TokenIndexer } from 'morgan';
import { blue, green, red, yellow } from 'cli-color';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CommentDto } from '../entities/dto/comment.dto';
import { FeedDto } from '../entities/dto/feed.dto';
import { FeedSymbolDto } from '../entities/dto/feedSymbol.dto';
import { TempFeedDto } from '../entities/dto/tempFeed.dto';
import { UserDto } from '../entities/dto/user.dto';

export class CustomError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type DtoClassType =
  | typeof CommentDto
  | typeof FeedDto
  | typeof FeedSymbolDto
  | typeof TempFeedDto
  | typeof UserDto;

export async function transformAndValidateDTO<T extends object>(
  cls: DtoClassType,
  plain: object
): Promise<T> {
  const instance: T = plainToInstance(cls as any, plain);
  await validateOrReject(instance).catch(errors => {
    throw { status: 500, message: errors[0].constraints };
  });
  return instance;
}

// TODO 아래 함수들 모두 Class-static method로 변경
function asyncWrap(asyncController: express.RequestHandler) {
  return async (...[req, res, next]: Parameters<express.RequestHandler>) => {
    try {
      await asyncController(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

// 클라이언트가 잘못된 API 주소로 요청을 하였을 때의 에러핸들링
function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new CustomError(404, 'Not Found API'));
}

// tip) errHandler 함수를 화살표함수로 변환한다면 parameter의 type으로 `ErrorRequestHandler`를 Express에서 import하여 지정해주면 된다.
function errHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let errInfo = err.sqlMessage
    ? {
        message: 'failed in SQL',
        status: 500,
        ...err,
      }
    : {
        ...err,
        status: err.status || 500,
        message: err.message || '',
      };
  res.status(errInfo.status).json({ message: errInfo.message });
}
function bodyText(req: Request): string {
  let bodyText: string = '';
  if (req.method !== 'GET') {
    bodyText =
      `${yellow('BODY\t|')}` +
      Object.keys(req.body)
        .map(
          (key: string, index: number): string =>
            `${index === 0 ? '' : '\t' + yellow('|')} ${green.italic(key)} ${
              req.body[key]
            }`
        )
        .join('\n') +
      '\n';
  }
  return bodyText;
}

function morganCustomFormat(
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response
) {
  let result: string = [
    `\n= ${red('MESSAGE')} =`,
    '\n',
    `${blue('URL\t| ')}`,
    tokens.url(req, res),
    '\n',
    `${blue('METHOD\t| ')}`,
    tokens.method(req, res),
    '\n',
    bodyText(req),
    `${blue('STATUS\t| ')}`,
    tokens.status(req, res),
    '\n',
    `${blue('RESP\t| ')}`,
    tokens['response-time'](req, res),
    'ms',
    `${blue('\nDATE\t|')} `,
    new Date().toLocaleTimeString(),
    '\n',
  ].join('');

  return result;
}

export { asyncWrap, notFoundHandler, errHandler, morganCustomFormat };
