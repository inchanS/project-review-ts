import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { morganCustomFormat } from './utils/util';
import router from './routes/index.route';

let corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

const createApp = () => {
  const app: Express = express();
  app.use(cors(corsOptions));

  if (process.env.NODE_ENV === 'develop') {
    app.use(morgan(morganCustomFormat));
  } else {
    app.use(morgan('combined'));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(router);

  app.use((err: any, req: Request, res: Response) => {
    const { status, message } = err;
    console.error(err);
    res.status(status || 500).json({ message });
  });

  return app;
};

export { createApp };
