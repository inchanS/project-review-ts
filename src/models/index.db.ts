import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  logging: process.env.TYPEORM_LOGGING,
  synchronize: process.env.TYPEORM_SYNCHRONIZE,
});
dataSource
  .initialize()
  .then(() => {
    if (process.env.NODE_ENV === 'production') {
      console.log('Data Source has been initialized!');
    }
  })
  .catch((err: Error) => {
    console.error('Error during Data Source initialization:', err);
  });

export default dataSource;