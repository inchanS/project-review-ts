import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { User } from '../entities/users.entity';

const signUp = async (req: Request, res: Response): Promise<void> => {
  const { name, nickname, password, email }: User = req.body;
  const userInfo = { name, nickname, password, email };

  await usersService.signUp(userInfo);

  res.status(201).json({ message: `signup success` });
};

const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: User = req.body;

  const result = await usersService.signIn(email, password);
  res.status(200).json({ message: `signin success`, result });
};

export default { signUp, signIn };
