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

// api Test시 초기세팅용 마이그레이션 폴더를 따로 지정(product 마이그레이션 파일 commit history와 다르기 때문)
const migrationsLocation =
  process.env.NODE_ENV === 'test'
    ? '/../tests/integrationTest/migrations/*.{js,ts}'
    : '/../migrations/*.{js,ts}';

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
  migrations: [__dirname + migrationsLocation],
  migrationsTableName: 'migrations',
});
export default dataSource;
