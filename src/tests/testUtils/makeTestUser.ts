import bcrypt from 'bcryptjs';
import { Express } from 'express';
import request from 'supertest';
import { Response } from 'superagent';

export class MakeTestUser {
  public static hashPwd(userInfo: TestUserInfo): string {
    return bcrypt.hashSync(userInfo.password, bcrypt.genSaltSync());
  }

  public static signingInfo(userInfo: TestUserInfo): TestSignIn {
    return {
      email: userInfo.email,
      password: userInfo.password,
    };
  }

  public static userEntityInfo(userInfo: TestUserInfo): TestUserInfo {
    const hashPwd: string = this.hashPwd(userInfo);
    return {
      id: userInfo.id,
      nickname: userInfo.nickname,
      password: hashPwd,
      email: userInfo.email,
    };
  }

  // 반복되는 로그인 메소드
  public static async signinUser(
    app: Express,
    user: TestSignIn
  ): Promise<Response> {
    return request(app).post('/users/signin').send(user);
  }

  // 토큰을 필요로 하는 http get 메소드
  public static async makeAuthRequest(
    app: Express,
    user: TestSignIn,
    endpoint: string
  ): Promise<Response> {
    const authResponse = await this.signinUser(app, user);
    const token = authResponse.body.result.token;
    return request(app).get(endpoint).set('Authorization', token);
  }
}
