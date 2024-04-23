import { Request, Response } from 'express';
import { UserDto } from '../../entities/dto/user.dto';
import { AuthService } from '../../services/users/auth.service';
import { createAuthService } from '../../utils/serviceFactory';

// 사용자 회원가입, 로그인, 패스워드 리셋 관련 컨트롤러
class AuthController {
  constructor(private authService: AuthService) {}
  signUp = async (req: Request, res: Response): Promise<void> => {
    const { nickname, password, email }: UserDto = req.body;
    // type을 Entity에서 가져오지 말고, DTO로 처리하여 가져오는게 더 편하다.
    const userInfo: UserDto = { nickname, password, email };

    await this.authService.signUp(userInfo);

    res.status(201).json({ message: `SIGNUP_SUCCESS` });
  };

  signIn = async (req: Request, res: Response): Promise<void> => {
    const { email, password }: UserDto = req.body;

    const result: { token: string } = await this.authService.signIn(
      email,
      password
    );
    res.status(200).json({ message: `SIGNIN_SUCCESS`, result });
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { email }: UserDto = req.body;
    const resetPasswordUrl: string = req.body.resetPasswordUrl;

    await this.authService.resetPassword(email, resetPasswordUrl);
    res.status(200).json({ message: `RESET_PASSWORD_SUCCESS_AND_SEND_MAIL` });
  };
}

export default new AuthController(createAuthService());
