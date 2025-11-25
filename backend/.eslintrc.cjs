module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true
  },
  ignorePatterns: ['dist', 'node_modules'],
  extends: ['eslint:recommended', 'eslint-config-prettier'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
    'no-console': 'off'
  }
};
