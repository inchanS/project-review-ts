import { Request, Response } from 'express';
import { ValidatorService } from '../../services/users/validator.service';
import { User } from '../../entities/users.entity';

class ValidatorController {
  constructor(private validatorService: ValidatorService) {}
  getUserInfo = async (req: Request, res: Response): Promise<void> => {
    let targetUserId: number = Number(req.params.id);
    const loggedInUserId: number = req.userInfo?.id;

    if (!targetUserId) {
      targetUserId = loggedInUserId;
    }
    const result: User = await this.validatorService.validateUserInfo(
      targetUserId
    );

    res.status(200).json(result);
  };

  checkDuplicateNickname = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    // 타입 단언(type assertions)을 사용한 타입에러 우회
    const nickname: string = req.query.nickname as string;

    // type Guard를 사용한 타입에러 우회
    // if (typeof nickname !== 'string') {
    //   throw new CustomError(
    //     400,
    //     "Query param 'nickname' has to be of type string"
    //   );
    // }

    // const result = await this.validatorService.checkDuplicateNickname(nickname);
    const result: { message: string } =
      await this.validatorService.checkDuplicateNickname(nickname);

    res.status(200).json(result);
  };

  checkDuplicateEmail = async (req: Request, res: Response): Promise<void> => {
    const email: string = req.query.email as string;

    const result: { message: string } =
      await this.validatorService.checkDuplicateEmail(email);
    res.status(200).json(result);
  };
}

export default new ValidatorController(new ValidatorService());
