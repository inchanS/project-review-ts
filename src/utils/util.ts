import express, { ErrorRequestHandler, Request, Response } from 'express';
import { TokenIndexer } from 'morgan';

// FIXME : CustomError 방식으로 전체 에러들 처리하기
export class CustomError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// TODO 여기 생성형함수를 클래스타입으로 바꿀 수 있을까?
function asyncWrap(asyncController: express.RequestHandler) {
  return async (...[req, res, next]: Parameters<express.RequestHandler>) => {
    try {
      await asyncController(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

const errHandler: ErrorRequestHandler = (err, _req, res) => {
  let errInfo = err;
  if (err.sqlMessage) {
    errInfo = { message: 'failed in SQL', status: 500, ...err };
  }
  res.status(errInfo.status || 500).json({ message: errInfo.message || '' });
};

import { yellow, red, blue, green } from 'cli-color';
function bodyText(req: Request) {
  let bodyText = '';
  if (req.method !== 'GET') {
    bodyText = `${yellow('BODY\t|')}`;
    bodyText +=
      Object.keys(req.body)
        .map((key, index) => {
          return `${index === 0 ? '' : '\t' + yellow('|')} ${green.italic(
            key
          )} ${req.body[key]}`;
        })
        .join('\n') + '\n';
  }
  return bodyText;
}

function morganCustomFormat(
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response
) {
  return [
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
}

export { asyncWrap, errHandler, morganCustomFormat };
