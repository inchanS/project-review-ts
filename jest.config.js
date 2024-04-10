module.exports = {
  verbose: true,
  collectCoverage: true,
  setupFiles: ['<rootDir>/src/tests/setup-test.ts'],
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/tests/unitTest/*.test.ts',
        '<rootDir>/src/tests/unitTest/**/*.test.ts',
      ],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/tests/integrationTest/*.test.ts',
        '<rootDir>/src/tests/integrationTest/**/*.test.ts',
      ],
      globalSetup: '<rootDir>/src/tests/integrationTest/setup/globalSetup.ts',
      globalTeardown:
        '<rootDir>/src/tests/integrationTest/setup/globalTeardown.ts',
    },
  ],
};
