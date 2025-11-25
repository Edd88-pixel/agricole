module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  ignorePatterns: ['dist', 'coverage', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/jsx-runtime',
    'eslint-config-prettier'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react/prop-types': 'off'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}', 'vitest.setup.ts'],
      env: {
        node: true
      },
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    }
  ]
};
