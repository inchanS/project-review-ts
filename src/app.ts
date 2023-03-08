import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { morganCustomFormat } from './utils/util';
import router from './routes/index.route';
import { specs } from './utils/swagger';
import swaggerUi from 'swagger-ui-express';

let corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

const createApp = () => {
  const app: Express = express();
  app.use(cors(corsOptions));

  if (process.env.NODE_ENV === 'develop') {
    app.use(morgan(morganCustomFormat));
    // app.use(morgan('dev'));
  } else if (process.env.NODE_ENV === 'test') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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
