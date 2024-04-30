import dataSource from '../../../repositories/data-source';
import { TestUtils } from './testUtils';

export class TestInitializer {
  static initialize(descr: string, tests: () => void) {
    describe(descr, () => {
      beforeAll(TestInitializer.iniDataSource);
      afterAll(TestInitializer.clearAndDestroyDataSource);
      tests();
    });
  }

  private static async iniDataSource() {
    try {
      await dataSource.initialize();

      if (process.env.NODE_ENV === 'test') {
        console.log(
          '💥TEST Data Source for Feed CRUD API has been initialized!'
        );
      }
    } catch (error) {
      console.log('Data Source for Feed CRUD API Initializing failed:', error);
    }
  }

  private static async clearAndDestroyDataSource() {
    await TestUtils.clearDatabaseTables(dataSource);
    await dataSource.destroy();
    console.log('💥TEST Data Source for Feed CRUD API has been destroyed!');
  }
}
