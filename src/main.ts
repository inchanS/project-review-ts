import dotenv from 'dotenv';
import path from 'path';
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(__dirname, '/../env/.env.production') });
} else if (process.env.NODE_ENV === 'develop') {
  dotenv.config({ path: path.join(__dirname, '/../env/.env.dev') });
  console.log('process.env.NODE_ENV is ', process.env.NODE_ENV);
} else if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '/../env/.env.test') });
} else {
  throw new Error('process.env.NODE_ENV IS_NOT_SET!!');
}

// debugger 용으로 임시 사용
// } else {
//   dotenv.config({ path: path.join(__dirname, '/../env/.env.dev') });
//   console.log('process.env.NODE_ENV IS_NOT_SET!! RUN_DEV_MODE!!');
// }

import dataSource from './repositories/index.db';
import { createApp } from './app';

const startApp = async () => {
  const app = createApp();
  const url = process.env.ORIGIN_URL;
  const port = process.env.PORT;

  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at ${url}${port}`);

    dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'develop') {
          console.log('Data Source has been initialized!');
        }

        if (process.env.NODE_ENV === 'test') {
          console.log('TEST Data Source has been initialized! 💥');
        }
      })
      .catch((err: Error) => {
        console.error('Error during Data Source initialization:', err);
      });
  });
};

startApp();
