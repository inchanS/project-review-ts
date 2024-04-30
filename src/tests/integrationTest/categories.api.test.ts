import { Express } from 'express';
import { createApp } from '../../app';
import request from 'supertest';
import { Response } from 'superagent';
import { Category } from '../../entities/category.entity';
import { TestInitializer } from './testUtils/testInitializer';

const app: Express = createApp();

TestInitializer.initialize('Categories API', () => {
  const endpoint: string = '/categories';

  test('get Categories: success', async () => {
    const result: Response = await request(app).get(endpoint);

    expect(result.status).toBe(200);
    expect(result.body).toBeInstanceOf(Array);

    expect(result.body.length).toBeGreaterThanOrEqual(7);

    expect(Object.keys(result.body).length).toBe(8);

    expect(
      result.body.every((item: Category) => item.hasOwnProperty('id'))
    ).toBe(true);

    expect(
      result.body.every((item: Category) => item.hasOwnProperty('category'))
    ).toBe(true);

    expect(
      result.body.every((item: Category) => item.hasOwnProperty('description'))
    ).toBe(true);
  });
});
