// eslint.config.js
import { defineConfig } from 'eslint/config';

import { baseConfig } from '@repo/config/eslint.config.js';

export default defineConfig([
  ...baseConfig({
    // Isomorphic: consumed by both the browser client and the node server.
    env: 'shared',
  }),
]);
