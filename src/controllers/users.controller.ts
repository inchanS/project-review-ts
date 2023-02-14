import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { UserDto } from '../entities/dto/user.dto';

const signUp = async (req: Request, res: Response): Promise<void> => {
  const { nickname, password, email }: UserDto = req.body;
  // type을 Entity에서 가져오지 말고, DTO로 처리하여 가져오는게 더 편하다.
  const userInfo: UserDto = { nickname, password, email };

  await usersService.signUp(userInfo);

  res.status(201).json({ message: `SIGNUP_SUCCESS` });
};

const checkDuplicateNickname = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { nickname }: UserDto = req.query;
  const result = await usersService.checkDuplicateNickname(nickname);
  res.status(200).json(result /**/);
};

const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: UserDto = req.body;

  const result = await usersService.signIn(email, password);
  res.status(200).json({ message: `SIGNIN_SUCCESS`, result });
};

// TODO : 해당되는 feed, comment의 Date 역시 16자리로 변경해서 반환처리하기
const getMe = async (req: Request, res: Response): Promise<void> => {
  const myInfo = await usersService.getMe(req.userInfo.id);
  res.status(200).json(myInfo);
};

export default { signUp, signIn, getMe, checkDuplicateNickname };
