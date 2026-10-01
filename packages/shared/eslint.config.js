// eslint.config.js
import { defineConfig } from 'eslint/config';

import { baseConfig } from '@repo/config/eslint.base';

export default defineConfig([
  ...baseConfig({
    // Isomorphic: consumed by both the browser client and the node server.
    env: 'shared',
  }),
]);
