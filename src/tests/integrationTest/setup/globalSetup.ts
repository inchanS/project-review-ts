import dataSource from '../../../repositories/data-source';

module.exports = async () => {
  await dataSource
    .initialize()
    .then(() => {
      if (process.env.NODE_ENV === 'test') {
        console.log('💥TEST Data Source has been initialized!');
      }
    })
    .catch(error => {
      console.log('Data Source Initializing failed:', error);
    });

  await dataSource
    .synchronize(true)
    .then(() => {
      if (process.env.NODE_ENV === 'test') {
        console.log('💥TEST Data Source has been synchronized!');
      }
    })
    .catch(error => {
      console.log('Data Source synchronizing failed:', error);
    });

  await dataSource
    .runMigrations()
    .then(() => {
      if (process.env.NODE_ENV === 'test') {
        console.log('💥TEST Data Source has been runMigrations!');
      }
    })
    .catch(error => {
      console.log('Migration sync failed:', error);
    });
};
