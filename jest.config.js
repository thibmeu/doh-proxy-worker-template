module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.ts'],
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'lcov', 'text'],
}
