import dataSource from './repositories/data-source';
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

          const offset = new Date().getTimezoneOffset();
          const offsetHours = offset / 60;
          console.log(`Current timezone offset: ${offsetHours} hours`);
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
