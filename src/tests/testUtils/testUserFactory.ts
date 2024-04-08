import bcrypt from 'bcryptjs';

export class TestUserFactory {
  // hash Password 생성 함수
  public static hashPassword(password: string): string {
    return bcrypt.hashSync(password, bcrypt.genSaltSync());
  }

  // 로그인용 정보 객체 생성
  public static createSignInInfo(userInfo: TestUserInfo): TestSignIn {
    return {
      email: userInfo.email,
      password: userInfo.password,
    };
  }

  // hash 패스워드를 포함하여 User 엔티티에 저장할수 있는 정보 생성 함수
  public static createUserEntity(userInfo: TestUserInfo): TestUserInfo {
    const hashedPassword: string = this.hashPassword(userInfo.password);
    return {
      id: userInfo.id,
      nickname: userInfo.nickname,
      password: hashedPassword,
      email: userInfo.email,
    };
  }
}
