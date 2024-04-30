import { createApp } from '../../app';
import { Express } from 'express';
import request from 'supertest';
import { Response } from 'superagent';
import { TestInitializer } from './testUtils/testInitializer';

const app: Express = createApp();

TestInitializer.initialize('Singletons of Repositories Instance Test', () => {
  const endpoint: string = '/test/singletons';

  test('Repositories Singletons instance Test', async () => {
    const result: Response = await request(app).get(endpoint);

    expect(result.status).toBe(200);
    expect(Object.keys(result.body)).toHaveLength(5);

    const allValid = (Object.values(result.body) as string[]).every(
      (item: string): boolean => item === 'Instance is valid: true'
    );
    expect(allValid).toBe(true);
  });
});
