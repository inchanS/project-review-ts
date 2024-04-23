import { Request, Response } from 'express';
import { UserDto } from '../../entities/dto/user.dto';
import { UserService } from '../../services/users/user.service';
import { User } from '../../entities/users.entity';
import { createUserService } from '../../utils/serviceFactory';

// 사용자 정보 수정, 삭제와 관련한 컨트롤러
class UserController {
  constructor(private userService: UserService) {}

  updateUserInfo = async (req: Request, res: Response): Promise<void> => {
    const { nickname, password, email }: UserDto = req.body;
    const userInfo: UserDto = { nickname, password, email };
    const userId: number = req.userInfo.id;

    const result: User = await this.userService.updateUserInfo(
      userId,
      userInfo
    );
    res.status(200).json({ message: `UPDATE_USERINFO_SUCCESS`, result });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userId: number = req.userInfo.id;
    await this.userService.deleteUser(userId);
    res.status(200).json({ message: `DELETE_USER_SUCCESS` });
  };
}

export default new UserController(createUserService());
