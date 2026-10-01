import rateLimit from 'express-rate-limit';

import { env } from '../config/env';

const isDev = env.NODE_ENV === 'development';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 2000 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 200 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/**
 * Interview actions are model calls: 60 per user per hour. The reducer's
 * `MAX_TURNS` (40) is the harder per-interview cap and is enforced in code.
 */
export const interviewRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isDev ? 600 : 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/**
 * Synthesis is the most expensive call in the app (stronger model, longer
 * prompt), so it gets its own tighter budget: 10 per user per hour.
 */
export const synthesisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isDev ? 100 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
