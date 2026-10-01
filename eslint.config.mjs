// eslint.config.mjs
import baseConfig from './packages/config/eslint.base.mjs';
import prettierConfig from 'eslint-config-prettier';

export default [
  ...baseConfig,
  // Add any root-specific overrides here
  {
    rules: {
      // Example: enforce no console logs in production code
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // eslint-config-prettier MUST be last to override formatting rules
  prettierConfig,
];
