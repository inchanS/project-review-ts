import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { User } from '../entities/users.entity';

const signUp = async (req: Request, res: Response): Promise<void> => {
  const { nickname, password, email }: User = req.body;
  const userInfo: User = { nickname, password, email };

  await usersService.signUp(userInfo);

  res.status(201).json({ message: `signup success` });
};

const checkDuplicateNickname = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { nickname }: User = req.query;
  const result = await usersService.checkDuplicateNickname(nickname);
  res.status(200).json(result);
};

const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: User = req.body;

  const result = await usersService.signIn(email, password);
  res.status(200).json({ message: `signin success`, result });
};

const getMe = async (req: Request, res: Response): Promise<void> => {
  const result = await usersService.getMe(req.id);
  res.status(200).json(result);
};

export default { signUp, signIn, getMe, checkDuplicateNickname };
