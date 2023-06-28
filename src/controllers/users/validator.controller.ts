import { Request, Response } from 'express';
import { UserDto } from '../../entities/dto/user.dto';
import validatorService from '../../services/users/validator.service';

const checkDuplicateNickname = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { nickname }: UserDto = req.query;
  const result = await validatorService.checkDuplicateNickname(nickname);
  res.status(200).json(result /**/);
};

const checkDuplicateEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email }: UserDto = req.query;
  const result = await validatorService.checkDuplicateEmail(email);
  res.status(200).json(result);
};

export default {
  checkDuplicateNickname,
  checkDuplicateEmail,
};
