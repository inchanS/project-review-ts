import { Request, Response } from 'express';
import { UserDto } from '../../entities/dto/user.dto';
import authService from '../../services/users/auth.service';

const signUp = async (req: Request, res: Response): Promise<void> => {
  const { nickname, password, email }: UserDto = req.body;
  // type을 Entity에서 가져오지 말고, DTO로 처리하여 가져오는게 더 편하다.
  const userInfo: UserDto = { nickname, password, email };

  await authService.signUp(userInfo);

  res.status(201).json({ message: `SIGNUP_SUCCESS` });
};

const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: UserDto = req.body;

  const result = await authService.signIn(email, password);
  res.status(200).json({ message: `SIGNIN_SUCCESS`, result });
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email }: UserDto = req.body;
  const resetPasswordUrl: string = req.body.resetPasswordUrl;

  await authService.resetPassword(email, resetPasswordUrl);
  res.status(200).json({ message: `RESET_PASSWORD_SUCCESS_AND_SEND_MAIL` });
};

export default {
  signUp,
  signIn,
  resetPassword,
};
