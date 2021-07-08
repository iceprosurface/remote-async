module.exports = {
  // verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  reporters: ['default'],
  coverageThreshold: {
    global: {
      branches: 69,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
