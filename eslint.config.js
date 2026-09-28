import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import testingLibrary from 'eslint-plugin-testing-library';
import jestDom from 'eslint-plugin-jest-dom';
import tailwindcss from 'eslint-plugin-tailwindcss';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import storybook from 'eslint-plugin-storybook';
import checkFile from 'eslint-plugin-check-file';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'e2e/.auth/**',
      'public/mockServiceWorker.js',
      'generators/**',
    ],
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  js.configs.recommended,
  storybook.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    plugins: { react: reactPlugin },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs['recommended-latest'].rules },
  },
  jsxA11y.flatConfigs.recommended,
  { rules: { 'jsx-a11y/anchor-is-valid': 'off' } },
  testingLibrary.configs['flat/react'],
  jestDom.configs['flat/recommended'],
  {
    plugins: { tailwindcss },
    settings: { tailwindcss: { cssConfigPath: 'src/index.css' } },
    rules: { ...tailwindcss.configs.recommended.rules },
  },
  {
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules },
  },
  {
    files: ['e2e/**/*.{ts,tsx}'],
    plugins: { playwright },
    rules: { ...playwright.configs['flat/recommended'].rules },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'check-file': checkFile },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // disables cross-feature imports:
            // eg. src/features/discussions should not import from src/features/comments, etc.
            {
              target: './src/features/auth',
              from: './src/features',
              except: ['./auth'],
            },
            {
              target: './src/features/comments',
              from: './src/features',
              except: ['./comments'],
            },
            {
              target: './src/features/discussions',
              from: './src/features',
              except: ['./discussions'],
            },
            {
              target: './src/features/teams',
              from: './src/features',
              except: ['./teams'],
            },
            {
              target: './src/features/users',
              from: './src/features',
              except: ['./users'],
            },
            // enforce unidirectional codebase:

            // e.g. src/app can import from src/features but not the other way around
            {
              target: './src/features',
              from: './src/app',
            },

            // e.g src/features and src/app can import from these shared modules but not the other way around
            {
              target: [
                './src/components',
                './src/hooks',
                './src/lib',
                './src/types',
                './src/utils',
              ],
              from: ['./src/features', './src/app'],
            },
          ],
        },
      ],
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{ts,tsx}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
  {
    files: ['src/**'],
    ignores: ['src/**/__tests__/**'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          '**/*': 'KEBAB_CASE',
        },
      ],
    },
  },
  {
    plugins: { prettier: prettierPlugin },
    rules: { 'prettier/prettier': ['error', {}, { usePrettierrc: true }] },
  },
  prettierConfig,
);
