import request from 'supertest';
import { createApp } from '../app';
import { DataSource } from 'typeorm';
import jwt from 'jsonwebtoken';
import usersService from '../services/users.service';
import { userRepository } from '../models/index.repository';

const dataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  logging: Boolean(process.env.TYPEORM_LOGGING),
  synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
});

describe('users.service UNIT test', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('checkDuplicateNickname - !nickname', async () => {
    let nickname: string;
    await expect(async () => {
      await usersService.checkDuplicateNickname(nickname);
    }).rejects.toThrowError(new Error(`NICKNAME_IS_UNDEFINED`));
  });

  test('checkDuplicateNickname - !checkData', async () => {
    const nickname = 'abc';
    const userRepositoryResult = {
      nickname: nickname,
    };

    jest
      .spyOn(await userRepository, 'findOneBy')
      .mockResolvedValue(userRepositoryResult);

    await expect(async () => {
      await usersService.checkDuplicateNickname(nickname);
    }).rejects.toThrowError(
      new Error(`${nickname}_IS_NICKNAME_THAT_ALREADY_EXSITS`)
    );
  });

  test('checkDuplicateNickname - success', async () => {
    jest.spyOn(await userRepository, 'findOneBy').mockResolvedValue(null);

    const nickname = 'nickname1234';

    await expect(
      usersService.checkDuplicateNickname(nickname)
    ).resolves.toEqual({
      message: 'AVAILABLE_NICKNAME',
    });
  });
});

describe('USERS API test', () => {
  let app: any = createApp();

  beforeAll(async () => {
    await dataSource.initialize().then(() => {
      if (process.env.NODE_ENV === 'test') {
        console.log('💥TEST Data Source has been initialized!💥');
      }
    });
  });

  afterAll(async () => {
    await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0`);
    await dataSource.query(`TRUNCATE users`);
    await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`);
    await dataSource.destroy();
  });

  test('create user', async () => {
    await request(app)
      .post('/users/signup')
      .send({
        email: 'test112@test.com',
        password: 'testPassword112!',
      })
      .expect(500)
      .expect({
        message: {
          maxLength: 'nickname must be shorter than or equal to 20 characters',
          minLength: 'nickname must be longer than or equal to 2 characters',
          isNotEmpty: 'nickname should not be empty',
          isString: 'nickname must be a string',
        },
      });

    await request(app)
      .post('/users/signup')
      .send({
        email: 'test112@test.com',
        nickname: 'nickname112',
        password: 'testPassword112!',
      })
      .expect(201)
      .expect({ message: 'SIGNUP_SUCCESS' });

    await request(app)
      .post('/users/signup')
      .send({
        email: 'test113@test.com',
        nickname: 'nickname112',
        password: 'testPassword112!',
      })
      .expect({ message: 'nickname112_IS_NICKNAME_THAT_ALREADY_EXSITS' });

    await request(app)
      .post('/users/signup')
      .send({
        email: 'test112@test.com',
        nickname: 'nickname113',
        password: 'testPassword112!',
      })
      .expect({ message: 'test112@test.com_IS_MAIL_THAT_ALREADY_EXSITS' });
  });

  test('check duplicate nickname', async () => {
    await request(app)
      .get('/users/signup?nickname=nickname113')
      .expect(200)
      .expect({ message: 'AVAILABLE_NICKNAME' });

    await request(app)
      .get('/users/signup?nickname=nickname112')
      .expect(409)
      .expect({ message: `nickname112_IS_NICKNAME_THAT_ALREADY_EXSITS` });

    await request(app)
      .get('/users/signup')
      .expect({ message: `NICKNAME_IS_UNDEFINED` });
  });

  test('log in', async () => {
    await request(app)
      .post('/users/signin')
      .send({ email: 'test112@test.com', password: 'testPassword112!' })
      .expect(200);

    await request(app)
      .post('/users/signin')
      .send({ email: 'test112@test.com', password: 'Password112!' })
      .expect(404)
      .expect({ message: 'PASSWORD_IS_INCORRECT' });

    await request(app)
      .post('/users/signin')
      .send({ email: 'test114@test.com', password: 'Password112!' })
      .expect(500)
      .expect({ message: 'test114@test.com_IS_NOT_FOUND' });
  });

  test('get me test', async () => {
    const token = jwt.sign({ id: 1 }, process.env.SECRET_KEY);
    const expected = { id: 1 };
    await request(app)
      .get('/users/getme')
      .set({ Authorization: token })
      .expect(200)
      .then(res => {
        expect.objectContaining(expected);
        expect(res.body).not.toHaveProperty('password');
      });
  });
});
