import bcrypt from 'bcryptjs';
import { Express } from 'express';
import request from 'supertest';
import { Response } from 'superagent';

export class MakeTestUser {
  // hash Password 생성 함수
  public static hashPwd(userInfo: TestUserInfo): string {
    return bcrypt.hashSync(userInfo.password, bcrypt.genSaltSync());
  }

  // 로그인용 정보 객체 생성
  public static signingInfo(userInfo: TestUserInfo): TestSignIn {
    return {
      email: userInfo.email,
      password: userInfo.password,
    };
  }

  // hash 패스워드를 포함하여 User 엔티티에 저장할수 있는 정보 생성 함수
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
  public static async makeAuthGetRequest(
    app: Express,
    user: TestSignIn,
    endpoint: string
  ): Promise<Response> {
    const authResponse: Response = await this.signinUser(app, user);
    const token = authResponse.body.result.token;
    return request(app).get(endpoint).set('Authorization', token);
  }

  // 토큰을 필요로 하는 http patch 메소드
  public static async makeAuthPostOrPatchRequest(
    app: Express,
    user: TestSignIn,
    endpoint: string,
    method: 'patch' | 'post',
    content: any
  ): Promise<Response> {
    const authResponse: Response = await this.signinUser(app, user);
    const token = authResponse.body.result.token;

    if (method === 'post') {
      return request(app)
        .post(endpoint)
        .set('Authorization', token)
        .send(content);
    } else {
      return request(app)
        .patch(endpoint)
        .set('Authorization', token)
        .send(content);
    }
  }
}
