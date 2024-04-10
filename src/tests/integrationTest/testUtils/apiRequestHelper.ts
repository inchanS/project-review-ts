import { Express } from 'express';
import request from 'supertest';
import { Response } from 'superagent';

export class ApiRequestHelper {
  // 반복되는 로그인 메소드
  public static async signinUser(
    app: Express,
    user: TestSignIn
  ): Promise<Response> {
    return request(app).post('/users/signin').send(user);
  }

  public static async getAuthToken(
    app: Express,
    user: TestSignIn
  ): Promise<string> {
    const authResponse: Response = await this.signinUser(app, user);
    return authResponse.body.result.token;
  }

  // 토큰을 필요로 하는 http get 메소드
  public static async makeAuthGetRequest(
    app: Express,
    user: TestSignIn,
    endpoint: string
  ): Promise<Response> {
    const token: string = await this.getAuthToken(app, user);
    return request(app).get(endpoint).set('Authorization', token);
  }

  // 토큰을 필요로 하는 http post 메소드
  public static async makeAuthPostRequest(
    app: Express,
    user: TestSignIn,
    endpoint: string,
    content: any
  ): Promise<Response> {
    const token: string = await this.getAuthToken(app, user);

    return request(app)
      .post(endpoint)
      .set('Authorization', token)
      .send(content);
  }

  // 토큰을 필요로 하는 http patch 메소드
  public static async makeAuthPatchRequest(
    app: Express,
    user: TestSignIn,
    endpoint: string,
    content: any
  ): Promise<Response> {
    const token: string = await this.getAuthToken(app, user);

    return request(app)
      .patch(endpoint)
      .set('Authorization', token)
      .send(content);
  }

  public static async makeAuthDeleteRequest(
    app: Express,
    user: TestSignIn,
    endpoint: string
  ): Promise<Response> {
    const token: string = await this.getAuthToken(app, user);

    return request(app).delete(endpoint).set('Authorization', token);
  }
}
