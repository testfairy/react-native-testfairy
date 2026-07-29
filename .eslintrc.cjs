module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  rules: {
    'no-console': 'off',
    'no-undef': 'error',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'all'],
  },
};
