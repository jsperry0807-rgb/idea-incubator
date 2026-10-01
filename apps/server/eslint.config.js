// eslint.config.js
import { defineConfig } from 'eslint/config';

import { baseConfig } from '@repo/config/eslint.config.js';

export default defineConfig([
  ...baseConfig({
    env: 'node',
    // Prisma client output is machine-generated and not ours to lint.
    ignores: ['src/generated/**'],
  }),
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // A server is expected to log to stdout for startup and diagnostics.
      'no-console': 'off',
      // Route handlers rely on `req.user!` after `requireAuth` has run; the
      // assertion is load-bearing and guarded by that middleware.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    // Tests may lean on assertion helpers and non-null access.
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
]);
