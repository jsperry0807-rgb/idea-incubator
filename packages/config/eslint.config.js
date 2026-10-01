// eslint.config.js
// Shared flat-config factory so every workspace lints with the same rules.
// Workspace configs compose this and only add their environment specifics.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

const SHARED_RULES = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  '@typescript-eslint/no-explicit-any': 'warn',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'error',
  eqeqeq: ['error', 'smart'],
};

/**
 * @param {object} options
 * @param {"node" | "browser" | "shared"} [options.env] Globals preset to use.
 * @param {string[]} [options.ignores] Extra paths to exclude from linting.
 * @param {object[]} [options.extraConfigs] Additional flat configs to append.
 * @param {object} [options.plugins] Plugins to register.
 * @param {object} [options.rules] Rules merged on top of the shared set.
 */
export function baseConfig({
  env = 'shared',
  ignores = [],
  extraConfigs = [],
  plugins = {},
  rules = {},
} = {}) {
  const globalSets =
    env === 'node' ? { ...globals.node } : env === 'browser' ? { ...globals.browser } : {};

  return defineConfig([
    globalIgnores(['dist', 'node_modules', 'build', 'coverage', ...ignores]),

    {
      files: ['**/*.{ts,tsx}'],
      extends: [js.configs.recommended, tseslint.configs.recommended, ...extraConfigs],
      plugins,
      languageOptions: {
        globals: globalSets,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      rules: {
        ...SHARED_RULES,
        ...rules,
      },
    },
  ]);
}
