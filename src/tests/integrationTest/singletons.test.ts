import { createApp } from '../../app';
import dataSource from '../../repositories/data-source';
import { TestUtils } from './testUtils/testUtils';
import { Express } from 'express';
import request from 'supertest';
import { Response } from 'superagent';

const app: Express = createApp();

describe('Singletons of Repositories Instance Test', () => {
  const endpoint: string = '/test/singletons';

  beforeAll(async () => {
    await dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'test') {
          console.log(
            '💥TEST Data Source for Singletons Test API has been initialized!'
          );
        }
      })
      .catch(error => {
        console.log(
          'Data Source for Singletons Test API Initializing failed:',
          error
        );
      });
  });

  afterAll(async () => {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy().then(() => {
      console.log(
        '💥TEST Data Source for Singletons Test API has been destroyed!'
      );
    });
  });

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
