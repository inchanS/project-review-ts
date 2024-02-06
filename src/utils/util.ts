import express, { NextFunction, Request, Response } from 'express';
import { TokenIndexer } from 'morgan';
import { blue, green, red, yellow } from 'cli-color';

export class CustomError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
function bodyText(req: Request) {
  let bodyText = '';
  if (req.method !== 'GET') {
    bodyText =
      `${yellow('BODY\t|')}` +
      Object.keys(req.body)
        .map(
          (key, index) =>
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
  let result = [
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
