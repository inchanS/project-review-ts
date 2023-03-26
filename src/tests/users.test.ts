import { User } from '../entities/users.entity';
import usersService from '../services/users.service';

describe('USERS UNIT test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return "AVAILABLE_NICKNAME" when nickname is available', async () => {
    const nickname: string = 'newNickname';
    jest.spyOn(User, 'findByNickname').mockResolvedValueOnce(null);

    const result = await usersService.checkDuplicateNickname(nickname);

    expect(result).toEqual({ message: 'AVAILABLE_NICKNAME' });
    expect(User.findByNickname).toBeCalledTimes(1);
    expect(User.findByNickname).toBeCalledWith(nickname);
  });
});
