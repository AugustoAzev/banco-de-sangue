module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '\.spec\.js$'],
  // Saídas do build: o servidor standalone e o pacote têm outro package.json e um
  // node_modules inteiro. Sem isto o Jest varre essas pastas e acusa colisão de nomes.
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/dist/'],
};
