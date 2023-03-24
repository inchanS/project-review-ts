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

const checkDuplicateEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email }: UserDto = req.query;
  const result = await usersService.checkDuplicateEmail(email);
  res.status(200).json(result);
};

const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: UserDto = req.body;

  const result = await usersService.signIn(email, password);
  res.status(200).json({ message: `SIGNIN_SUCCESS`, result });
};

const getMe = async (req: Request, res: Response): Promise<void> => {
  const myInfo = await usersService.getMe(req.userInfo.id);
  res.status(200).json(myInfo);
};

// 다른 사람의 정보 가져오기
const getUserInfo = async (req: Request, res: Response): Promise<void> => {
  const targetUserId = Number(req.params.id);
  const loggedInUserId = req.userInfo.id;
  const result = await usersService.getUserInfo(targetUserId, loggedInUserId);
  res.status(200).json(result);
};

const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
  const { nickname, password, email }: UserDto = req.body;
  const userInfo: UserDto = { nickname, password, email };
  const userId = req.userInfo.id;

  const result = await usersService.updateUserInfo(userId, userInfo);
  res.status(200).json({ message: `UPDATE_USERINFO_SUCCESS`, result });
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userInfo.id;
  await usersService.deleteUser(userId);
  res.status(200).json({ message: `DELETE_USER_SUCCESS` });
};

export default {
  signUp,
  signIn,
  getMe,
  checkDuplicateNickname,
  checkDuplicateEmail,
  getUserInfo,
  updateUserInfo,
  deleteUser,
};
