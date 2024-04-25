import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/users/auth.service';
import bcrypt from 'bcryptjs';
import { CustomError } from '../../utils/util';
import { TestUserInfo } from '../../types/test';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let validatorServiceMock: { validateCredentials: jest.Mock };
  let userCustomRepositoryMock: { findByEmail: jest.Mock };
  let userRepositoryMock: { find: jest.Mock };

  beforeEach(() => {
    validatorServiceMock = {
      validateCredentials: jest.fn(),
    };
    userCustomRepositoryMock = {
      findByEmail: jest.fn(),
    };
    userRepositoryMock = {
      find: jest.fn(),
    };

    authService = new AuthService(
      validatorServiceMock as any,
      userCustomRepositoryMock as any,
      userRepositoryMock as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: TestUserInfo = {
    id: 1,
    email: 'user@example.com',
    nickname: 'userNickname',
    password: '$2b$10$examplehashedpassword',
  };

  process.env.SECRET_KEY = 'test_secret_key';

  it('should return a token for valid credentials', async () => {
    userCustomRepositoryMock.findByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const jwtSecret = process.env.SECRET_KEY || 'default_secret_key';
    (jwt.sign as jest.Mock).mockReturnValue('mockedToken');

    const result = await authService.signIn('user@example.com', 'password123');
    expect(result).toEqual({ token: 'mockedToken' });
    expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.id }, jwtSecret);
  });

  it('should throw a 404 error if user not found or deleted', async () => {
    userCustomRepositoryMock.findByEmail.mockResolvedValue(null);
    await expect(
      authService.signIn('user@example.com', 'password123')
    ).rejects.toThrow(CustomError);

    const deletedUser = { ...mockUser, deleted_at: new Date() };
    userCustomRepositoryMock.findByEmail.mockResolvedValue(deletedUser);
    await expect(
      authService.signIn('user@example.com', 'password123')
    ).rejects.toThrow(CustomError);
  });

  it('should throw a 401 error if password is incorrect', async () => {
    userCustomRepositoryMock.findByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.signIn('user@example.com', 'wrongPassword')
    ).rejects.toThrow(CustomError);
  });
});
