import { baseConfig } from './packages/config/eslint.config.js';
import prettierConfig from 'eslint-config-prettier';

export default [
  ...baseConfig({ env: 'shared' }),
  // Root-specific overrides go here, after the shared base and before Prettier.
  // eslint-config-prettier MUST stay last so it can disable conflicting stylistic rules.
  prettierConfig,
];
