import dotenv from 'dotenv';
dotenv.config();
import { createApp } from './app';

const startApp = async () => {
  const app = createApp();
  const url = process.env.ORIGIN_URL;
  const port = process.env.PORT;

  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at ${url}${port}`);
  });
};

startApp();
