const request = require('supertest');
// import request from 'supertest';
import { createApp } from '../app';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_TEST_DATABASE,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  logging: process.env.TYPEORM_LOGGING,
  synchronize: process.env.TYPEORM_SYNCHRONIZE,
});

describe('회원가입', () => {
  let app: any = createApp();

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0`);
    await dataSource.query(`TRUNCATE users`);
    await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`);
    await dataSource.destroy();
  });

  test('create user', async (): Promise<any> => {
    await request(app)
      .post('/users/signup')
      .send({
        email: 'test112@test.com',
        nickname: 'nickname112',
        password: 'testPassword112!',
      })
      .expect(201);
  });

  test('log in', async (): Promise<any> => {
    await request(app)
      .post('/users/signin')
      .send({ email: 'test112@test.com', password: 'testPassword112!' })
      .expect(200);
  });
});

describe('test jest', () => {
  test('1 is 1', () => {
    expect(1).toBe(1);
  });
});
