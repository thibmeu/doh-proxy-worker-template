module.exports = {
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFiles: ['./jest.setup.ts'],
    },
    {
      runner: 'jest-runner-eslint',
      displayName: 'lint',
      testMatch: ['<rootDir>/src/**/*.ts', '<rootDir>/__tests__/**/*.ts'],
    },
  ],
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'lcov', 'text'],
}
