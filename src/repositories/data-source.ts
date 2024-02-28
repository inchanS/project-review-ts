import { DataSource } from 'typeorm';
import { config } from 'dotenv';
if (process.env.NODE_ENV === 'production') {
  config({ path: './env/.env.production' });
} else if (process.env.NODE_ENV === 'develop') {
  config({ path: './env/.env.dev' });
  console.log('process.env.NODE_ENV is ', process.env.NODE_ENV);
} else if (process.env.NODE_ENV === 'test') {
  config({ path: './env/.env.test' });
} else {
  throw new Error('process.env.NODE_ENV IS_NOT_SET!!');
}

const dataSource: DataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  logging: Boolean(process.env.TYPEORM_LOGGING),
  synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
  charset: 'utf8mb4',
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  migrationsTableName: 'migrations',
});
export default dataSource;
