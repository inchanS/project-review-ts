import dataSource from '../../../repositories/data-source';
import { TestUtils } from './testUtils';

export class TestInitializer {
  static initialize(descr: string, tests: () => void) {
    describe(descr, () => {
      beforeAll(() => TestInitializer.iniDataSource(descr));
      afterAll(() => TestInitializer.clearAndDestroyDataSource(descr));
      tests();
    });
  }

  private static async iniDataSource(descr: string) {
    try {
      await dataSource.initialize();

      if (process.env.NODE_ENV === 'test') {
        console.log(`💥TEST Data Source for ${descr} has been initialized!`);
      }
    } catch (error) {
      console.log(`Data Source for ${descr} Initializing failed:`, error);
    }
  }

  private static async clearAndDestroyDataSource(descr: string) {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy();
    console.log(`💥TEST Data Source for ${descr} has been destroyed!`);
  }
}
