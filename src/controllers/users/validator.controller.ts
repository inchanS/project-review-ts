import { Request, Response } from 'express';
import { ValidatorService } from '../../services/users/validator.service';

// Version 1
// 컨트롤러가 라우팅으로 들어갈때, "this"는 Express를 가르키므로 현재의 코드에서는 this.validatorService가 undefined가 된다.
// 따라서, this.validatorService를 사용하기 위해서는 해당 객체 내 메소드를 bind해주어야 한다.
// class ValidatorController {
//   private validatorService: ValidatorService;
//
//   constructor() {
//     this.validatorService = new ValidatorService();
//
//     this.checkDuplicateNickname = this.checkDuplicateNickname.bind(this);
//     this.checkDuplicateEmail = this.checkDuplicateEmail.bind(this);
//   }
//   async checkDuplicateNickname(req: Request, res: Response): Promise<void> {
//     const { nickname }: UserDto = req.query;
//
//     const result = await this.validatorService.checkDuplicateNickname(nickname);
//
//     res.status(200).json(result /**/);
//   }
//
//   async checkDuplicateEmail(req: Request, res: Response): Promise<void> {
//     const { email }: UserDto = req.query;
//
//     const result = await this.validatorService.checkDuplicateEmail(email);
//     res.status(200).json(result);
//   }
// }

// Version 2
// Version 1처럼 따로이 클래스 내부에서 bind를 해주지 않고, 화살표 함수를 이용하면 this는 화살표 함수를 둘러싼 객체를 가르키게 된다.
// 메소드가 많을 경우 화살표 함수를 이용하는 것이 각각 모두 bind 시키는 코드를 추가하지 않아도 됨으로 더 편하다.
class ValidatorController {
  private validatorService: ValidatorService;

  constructor() {
    this.validatorService = new ValidatorService();
  }
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

export default new ValidatorController();
