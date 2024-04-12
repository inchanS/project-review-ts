import dataSource from '../../repositories/data-source';
import { TestUtils } from './testUtils/testUtils';
import { Express } from 'express';
import { createApp } from '../../app';
import request from 'supertest';
import { Response } from 'superagent';
import { Category } from '../../entities/category.entity';

const app: Express = createApp();

describe('categories API', () => {
  const endpoint: string = '/categories';

  beforeAll(async () => {
    await dataSource
      .initialize()
      .then(() => {
        if (process.env.NODE_ENV === 'test') {
          console.log(
            '💥TEST Data Source for Categories API has been initialized!'
          );
        }
      })
      .catch(error => {
        console.log(
          'Data Source for Categories API Initializing failed:',
          error
        );
      });
  });

  afterAll(async () => {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy().then(() => {
      console.log('💥TEST Data Source for Categories API has been destroyed!');
    });
  });

  test('get Categories: success', async () => {
    const result: Response = await request(app).get(endpoint);

    expect(result.status).toBe(200);
    expect(result.body).toBeInstanceOf(Array);

    expect(result.body.length).toBeGreaterThanOrEqual(7);

    expect(
      result.body.every((item: Category) => Object.keys(item).length === 6)
    ).toBe(true);

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
