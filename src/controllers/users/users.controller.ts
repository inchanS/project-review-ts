import { Request, Response } from 'express';
import { UserDto } from '../../entities/dto/user.dto';
import userService from '../../services/users/user.service';

const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
  const { nickname, password, email }: UserDto = req.body;
  const userInfo: UserDto = { nickname, password, email };
  const userId = req.userInfo.id;

  const result = await userService.updateUserInfo(userId, userInfo);
  res.status(200).json({ message: `UPDATE_USERINFO_SUCCESS`, result });
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userInfo.id;
  await userService.deleteUser(userId);
  res.status(200).json({ message: `DELETE_USER_SUCCESS` });
};

export default {
  updateUserInfo,
  deleteUser,
};
