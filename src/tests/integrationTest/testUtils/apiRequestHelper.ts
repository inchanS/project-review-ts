import { Express } from 'express';
import request from 'supertest';
import { Response } from 'superagent';
import { createApp } from '../../../app';

export class ApiRequestHelper {
  private static app: Express = createApp();

  // 반복되는 로그인 메소드
  public static async signinUser(user: TestSignIn): Promise<Response> {
    return request(this.app).post('/users/signin').send(user);
  }

  public static async getAuthToken(user: TestSignIn): Promise<string> {
    const authResponse: Response = await this.signinUser(user);
    return authResponse.body.result.token;
  }

  // 토큰을 필요로 하는 http get 메소드
  public static async makeAuthGetRequest(
    token: string,
    endpoint: string
  ): Promise<Response> {
    return request(this.app).get(endpoint).set('Authorization', token);
  }

  // 토큰을 필요로 하는 http post 메소드
  public static async makeAuthPostRequest(
    token: string,
    endpoint: string,
    content: any
  ): Promise<Response> {
    return request(this.app)
      .post(endpoint)
      .set('Authorization', token)
      .send(content);
  }

  // 토큰을 필요로 하는 http patch 메소드
  public static async makeAuthPatchRequest(
    token: string,
    endpoint: string,
    content: any
  ): Promise<Response> {
    return request(this.app)
      .patch(endpoint)
      .set('Authorization', token)
      .send(content);
  }

  public static async makeAuthDeleteRequest(
    token: string,
    endpoint: string
  ): Promise<Response> {
    return request(this.app).delete(endpoint).set('Authorization', token);
  }
}
