import dataSource from './repositories/data-source';
import { createApp } from './app';
import * as fs from 'node:fs';
import * as https from 'node:https';

const startApp = async () => {
  const app = createApp();
  const url: string = process.env.ORIGIN_URL || 'http://localhost:';
  const port: number = parseInt(process.env.PORT || '8080', 10);

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

  // HTTPS 서버 세팅
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;

  if (!keyPath || !certPath) {
    console.error('SSL key or cert path not set in environment variables.');
    process.exit(1);
  }

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  // HTTPS 서버 실행
  const httpsPort: number = port + 10;
  https.createServer(httpsOptions, app).listen(httpsPort, () => {
    console.log(`HTTPS server is also running on port ${httpsPort}`);
  });
};

startApp();
