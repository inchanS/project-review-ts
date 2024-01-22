import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDto } from '../../../entities/dto/user.dto';
import { User } from '../../../entities/users.entity';
import { UserRepository } from '../../../repositories/user.repository';
import { AuthService } from '../../../services/users/auth.service';
import { SendMail } from '../../../utils/sendMail';

jest.mock('../../../repositories/user.repository');
jest.mock('../../../utils/sendMail');

describe('signUp', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('회원가입 - 실패: password가 정규식을 통과하지 못하였을 때, 에러 반환', async () => {
    const userInfo: UserDto = {
      email: 'email@mail.com',
      nickname: 'nickname',
      password: 'password',
    };

    await expect(authService.signUp(userInfo)).rejects.toEqual({
      status: 500,
      message: {
        matches: 'password only accepts english and number 그리고 특수기호',
      },
    });
  });

  test('회원가입 - 실패: password가 8자보다 짧거나 20자보다 길 때, 에러 반환', async () => {
    const minPasswordUser: UserDto = {
      email: 'email@mail.com',
      nickname: 'nickname',
      password: '1234',
    };

    const maxPasswordUser: UserDto = {
      email: 'email@mail.com',
      nickname: 'nickname',
      password: 'Password@1234567890123456789012323456789012345678901234567890',
    };

    await expect(authService.signUp(minPasswordUser)).rejects.toMatchObject({
      status: 500,
      message: {
        minLength: 'password must be longer than or equal to 8 characters',
      },
    });

    await expect(authService.signUp(maxPasswordUser)).rejects.toMatchObject({
      status: 500,
      message: {
        maxLength: 'password must be shorter than or equal to 20 characters',
      },
    });
  });

  test('회원가입 - 실패: email 형식이 아닐 때, 에러 반환', async () => {
    const userInfo: UserDto = {
      email: 'email',
      nickname: 'nickname',
      password: 'Password123@#',
    };

    await expect(authService.signUp(userInfo)).rejects.toEqual({
      status: 500,
      message: {
        isEmail: 'email must be an email',
      },
    });
  });

  test('회원가입 - 성공', async () => {
    const userInfo: UserDto = {
      email: '123@test.com',
      nickname: 'nickname',
      password: 'Password123@#',
    };

    const mockFindByEmail = jest.fn();
    jest
      .spyOn(UserRepository.prototype, 'findByEmail')
      .mockImplementation(mockFindByEmail);

    const mockFindByNickname = jest.fn();
    jest
      .spyOn(UserRepository.prototype, 'findByNickname')
      .mockImplementation(mockFindByNickname);

    const mockCreateUser = jest.fn();
    jest
      .spyOn(UserRepository.prototype, 'createUser')
      .mockImplementation(mockCreateUser);

    await authService.signUp(userInfo);

    expect(mockCreateUser).toBeCalledTimes(1);
    expect(mockCreateUser).toBeCalledWith(userInfo);
  });
});

describe('signIn', () => {
  let authService: AuthService;
  const email: string = 'email';
  const password: string = 'password';
  const fakeToken = 'fake_token';

  const salt = bcrypt.genSaltSync();
  const hashedPassword = bcrypt.hashSync(password, salt);

  const user = new User();
  user.password = hashedPassword;

  beforeEach(() => {
    jest.resetAllMocks();
    authService = new AuthService();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('로그인 - 실패: 사용자 중 해당 이메일을 찾을 수 없을 때, 에러반환', async () => {
    jest
      .spyOn(UserRepository.prototype, 'findByEmail')
      .mockResolvedValueOnce(null);

    await expect(authService.signIn(email, password)).rejects.toEqual({
      status: 404,
      message: `${email}_IS_NOT_FOUND`,
    });
  });

  test('로그인 - 실패: 사용자 중 해당 이메일이 삭제된 사용자일 때, 에러반환', async () => {
    const deletedUser = new User();
    deletedUser.deleted_at = new Date();

    jest
      .spyOn(UserRepository.prototype, 'findByEmail')
      .mockResolvedValueOnce(deletedUser);
  });

  test('로그인 - 실패: 비밀번호가 일치하지 않을 때, 에러반환', async () => {
    jest
      .spyOn(UserRepository.prototype, 'findByEmail')
      .mockResolvedValueOnce(user);

    await expect(authService.signIn(email, 'wrong_password')).rejects.toEqual({
      status: 401,
      message: 'PASSWORD_IS_INCORRECT',
    });
  });

  test('로그인 - 성공', async () => {
    jest
      .spyOn(UserRepository.prototype, 'findByEmail')
      .mockResolvedValueOnce(user);

    jwt.sign = jest.fn().mockImplementation(() => fakeToken);

    const result = await authService.signIn(email, password);

    expect(result).toEqual({
      token: fakeToken,
    });
  });
});

describe('resetPassword', () => {
  let authService: AuthService;
  const email = 'test@test.com';
  const resetPasswordUrl = 'http://localhost:3000/reset-password';

  const findOneMock = jest.spyOn(UserRepository.prototype, 'findOneOrFail');

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('사용자를 찾을 수 없을 때, 에러반환', async () => {
    findOneMock.mockRejectedValueOnce(new Error('USER_IS_NOT_FOUND'));
    jest.spyOn(UserRepository.prototype, 'findOneOrFail');

    await expect(
      authService.resetPassword(email, resetPasswordUrl)
    ).rejects.toEqual({
      status: 404,
      message: 'USER_IS_NOT_FOUND',
    });

    expect(findOneMock).toBeCalledTimes(1);
    expect(findOneMock).toBeCalledWith({ where: { email } });
  });

  test('사용자를 찾을 수 있을 때, 성공', async () => {
    const user = new User();
    user.id = 1;

    findOneMock.mockResolvedValue(user);

    SendMail.prototype.executeSendMail = jest.fn().mockResolvedValue({});

    jest.spyOn(jwt, 'sign').mockImplementation(() => 'testToken');

    await authService.resetPassword(email, resetPasswordUrl);

    expect(findOneMock).toBeCalledTimes(1);
    expect(findOneMock).toBeCalledWith({ where: { email } });

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: user.id },
      process.env.SECRET_KEY,
      { expiresIn: '10m' }
    );

    expect(SendMail.prototype.executeSendMail).toBeCalledTimes(1);
    expect(SendMail.prototype.executeSendMail).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: email,
      subject: '비밀번호를 재설정해주세요 - review site',
      // Check if the html includes the reset password URL.
      // The actual content might be longer and more complex
      html: expect.stringContaining(resetPasswordUrl),
    });
  });
});
