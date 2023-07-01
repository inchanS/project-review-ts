import { Request, Response } from 'express';
import { UserDto } from '../../entities/dto/user.dto';
import { ValidatorService } from '../../services/users/validator.service';

class ValidatorController {
  private validatorService: ValidatorService;

  constructor() {
    this.validatorService = new ValidatorService();
  }
  async checkDuplicateNickname(req: Request, res: Response): Promise<void> {
    const { nickname }: UserDto = req.query;

    const result = await this.validatorService.checkDuplicateNickname(nickname);
    res.status(200).json(result /**/);
  }

  async checkDuplicateEmail(req: Request, res: Response): Promise<void> {
    const { email }: UserDto = req.query;

    const result = await this.validatorService.checkDuplicateEmail(email);
    res.status(200).json(result);
  }
}

export default new ValidatorController();
