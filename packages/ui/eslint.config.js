// eslint.config.js
import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

import { baseConfig } from '@repo/config/eslint.base';

export default defineConfig([
  ...baseConfig({
    env: 'browser',
    extraConfigs: [reactHooks.configs.flat.recommended],
    plugins: { react },
    rules: {
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/no-array-index-key': 'warn',
    },
  }),
  {
    files: ['**/*.{ts,tsx}'],
    settings: { react: { version: 'detect' } },
  },
]);
