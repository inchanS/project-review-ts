import { request } from 'express';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TYPEORM_CONNECTION: 'mysql' | 'mariadb';
      TYPEORM_PORT: number;
      SECRET_KEY: string;
      TYPEORM_LOGGING: boolean;
      TYPEORM_SYNCHRONIZE: boolean;
    }
  }

  namespace Express {
    interface Request {
      id: number;
      userInfo: {
        id: number;
      };
      param: {
        id: number;
      };
    }
  }

  interface Error {
    status: number;
  }
}
