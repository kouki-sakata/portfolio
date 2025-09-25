import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import testingLibrary from 'eslint-plugin-testing-library'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const projectConfigs = tseslint.config({
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.vitest.json'],
      tsconfigRootDir: import.meta.dirname,
    },
    globals: {
      ...globals.browser,
    },
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    import: importPlugin,
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'import/newline-after-import': ['error', { count: 1 }],
    'import/no-default-export': 'error',
  },
})

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'build']),
  ...projectConfigs,
  {
    files: ['src/test/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      ...testingLibrary.configs.react.rules,
    },
  },
  {
    files: ['vite.config.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  eslintConfigPrettier,
])
