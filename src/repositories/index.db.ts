import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  dateStrings: true,
  logging: Boolean(process.env.TYPEORM_LOGGING),
  synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
  charset: 'utf8mb4',
});
export default dataSource;
