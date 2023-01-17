import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { morganCustomFormat } from '../src/utils/util';
import router from './routes';

let corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

const createApp = () => {
  const app: Express = express();
  app.use(cors(corsOptions));

  app.use(morgan(morganCustomFormat));
  app.use(express.json());
  app.use(router);

  app.use((err: any, req: Request, res: Response) => {
    const { status, message } = err;
    console.error(err);
    res.status(status || 500).json({ message });
  });

  return app;
};

export { createApp };
