// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';
import checkFile from 'eslint-plugin-check-file';
import boundaries from 'eslint-plugin-boundaries';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  // ─── Base config ──────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/no-array-index-key': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  // ─── Feature boundary enforcement ─────────────────────────────
  // Shared code must not reach into a feature. The composition root is the one
  // exception: it exists to wire features together.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/files': [
        {
          // Top-level app entry files aren't part of any layer
          category: 'app',
          pattern: ['src/App.tsx', 'src/main.tsx', 'src/axios.ts'],
        },
      ],
      'boundaries/elements': [
        { type: 'assets', pattern: 'src/assets/**' },
        // RootLayout is the composition root: it renders the shell and imports
        // the notification and auth features by design. It lives in src/app
        // rather than src/components precisely because everything in
        // src/components is required to stay feature-agnostic.
        { type: 'app', pattern: 'src/app/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'config', pattern: 'src/config/**' },
        { type: 'feature', pattern: 'src/features/**' },
        { type: 'i18n', pattern: 'src/i18n/**' },
        { type: 'pages', pattern: 'src/pages/**' },
        { type: 'stores', pattern: 'src/stores/**' },
        { type: 'utils', pattern: 'src/utils/**' },
      ],
      'boundaries/ignore': ['**/*.test.*', '**/*.spec.*'],
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              // A feature cannot be pulled into shared code: everything in
              // src/components is reusable and must stay feature-agnostic.
              from: { element: { type: 'components' } },
              disallow: [{ to: { element: { type: 'feature' } } }],
              message:
                'Shared components cannot depend on features. Move the component into the feature that owns it, or invert the dependency.',
            },
          ],
        },
      ],
    },
  },

  // ─── File naming conventions ───────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          // Global components → PascalCase
          'src/components/**/*.{ts,tsx}': 'PASCAL_CASE',

          // Feature slices
          'src/features/*/components/**/*.{ts,tsx}': 'PASCAL_CASE',
          'src/features/*/pages/**/*.{ts,tsx}': 'PASCAL_CASE',
          'src/features/*/hooks/*.{ts,tsx}': 'CAMEL_CASE',
          'src/features/*/api/*.{ts,tsx}': 'KEBAB_CASE',
          'src/features/*/store/*.{ts,tsx}': 'KEBAB_CASE',
          'src/features/*/context/*.{ts,tsx}': 'PASCAL_CASE',

          // Shared layers
          'src/pages/**/*.{ts,tsx}': 'PASCAL_CASE',
          'src/utils/**/*.ts': 'KEBAB_CASE',
          'src/config/**/*.ts': 'KEBAB_CASE',
          'src/i18n/**/*.ts': 'KEBAB_CASE',
        },
        { ignoreMiddleExtensions: true }, // allows Button.test.tsx, Button.stories.tsx
      ],
    },
  },

  // ─── Folder naming conventions ─────────────────────────────────
  {
    files: ['src/**/*'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/components/*/': 'KEBAB_CASE', // layout/, ui/
          'src/features/*/': 'KEBAB_CASE', // auth/, user-profile/
          'src/features/*/*/': 'KEBAB_CASE', // ideas/lib/, ideas/hooks/
          'src/assets/*/': 'KEBAB_CASE',
          'src/utils/*/': 'KEBAB_CASE',
          'src/config/*/': 'KEBAB_CASE',
        },
      ],
    },
  },

  // ─── Feature root — only types.ts allowed at the root level ────
  {
    files: ['src/features/*/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        // The only file allowed directly in src/features/<name>/ is types.ts
        { 'src/features/*/*.ts': 'SNAKE_CASE' }, // matches types.ts, and nothing else should be here
      ],
    },
  },

  // ─── Hooks must start with "use" ──────────────────────────────
  {
    files: ['src/**/hooks/*.{ts,tsx}', 'src/features/*/hooks/*.{ts,tsx}'],
    rules: {
      // Enforce that hook files start with "use"
      'no-restricted-syntax': [
        'error',
        {
          // This catches exported functions not starting with "use" inside hook files
          selector: 'ExportDefaultDeclaration > ArrowFunctionExpression',
          message: 'Hook files must export a named function starting with "use".',
        },
      ],
    },
  },
]);
