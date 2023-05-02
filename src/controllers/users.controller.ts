import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { UserDto } from '../entities/dto/user.dto';
import { Pagination } from '../repositories/feed.repository';

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

const signUp = async (req: Request, res: Response): Promise<void> => {
  const { nickname, password, email }: UserDto = req.body;
  // type을 Entity에서 가져오지 말고, DTO로 처리하여 가져오는게 더 편하다.
  const userInfo: UserDto = { nickname, password, email };

  await usersService.signUp(userInfo);

  res.status(201).json({ message: `SIGNUP_SUCCESS` });
};

const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: UserDto = req.body;

  const result = await usersService.signIn(email, password);
  res.status(200).json({ message: `SIGNIN_SUCCESS`, result });
};

// 유저의 가입정보 가져오기
const getUserInfo = async (req: Request, res: Response): Promise<void> => {
  const targetUserId = Number(req.params.id);
  const result = await usersService.findUserInfoByUserId(targetUserId);

  res.status(200).json(result);
};

// 유저의 모든 게시물 가져오기
const getUserFeeds = async (req: Request, res: Response): Promise<void> => {
  const targetUserId = Number(req.params.id);

  const startIndex = Number(req.query.index);
  const limit = Number(req.query.limit);
  const page: Pagination = { startIndex, limit };

  const result = await usersService.findUserFeedsByUserId(targetUserId, page);

  res.status(200).json(result);
};

// 유저의 모든 덧글 가져오기
const getUserComments = async (req: Request, res: Response): Promise<void> => {
  const targetUserId = Number(req.params.id);
  const loggedInUserId = req.userInfo.id;

  const startIndex = Number(req.query.index);
  const limit = Number(req.query.limit);
  const page: Pagination = { startIndex, limit };

  const result = await usersService.findUserCommentsByUserId(
    targetUserId,
    loggedInUserId,
    page
  );

  res.status(200).json(result);
};

// 유저의 모든 좋아요 가져오기
const getUserFeedSymbols = async (
  req: Request,
  res: Response
): Promise<void> => {
  const targetUserId = Number(req.params.id);
  const result = await usersService.findUserFeedSymbolsByUserId(targetUserId);

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

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email }: UserDto = req.body;
  const resetPasswordUrl: string = req.body.resetPasswordUrl;

  await usersService.resetPassword(email, resetPasswordUrl);
  res.status(200).json({ message: `RESET_PASSWORD_SUCCESS_AND_SEND_MAIL` });
};

export default {
  signUp,
  signIn,
  checkDuplicateNickname,
  checkDuplicateEmail,
  updateUserInfo,
  deleteUser,
  resetPassword,
  getUserInfo,
  getUserFeeds,
  getUserComments,
  getUserFeedSymbols,
};
