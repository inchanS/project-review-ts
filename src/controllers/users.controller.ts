import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { User } from '../entities/users.entity';

const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, nickname, password, email }: User = req.body;
  const userInfo = { name, nickname, password, email };

  await usersService.signup(userInfo);

  res.status(201).json({ message: `signup success` });
};

export default { signup };
