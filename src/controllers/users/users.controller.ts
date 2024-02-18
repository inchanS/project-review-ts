import { Request, Response } from 'express';
import { UserDto } from '../../entities/dto/user.dto';
import { UserService } from '../../services/users/user.service';
import { User } from '../../entities/users.entity';

class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

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

export default new UserController();
