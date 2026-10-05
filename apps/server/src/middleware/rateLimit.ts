import rateLimit from 'express-rate-limit';

import { env } from '../config/env';
import { TooManyRequestsError } from '../lib/errors';

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
 *
 * Express middleware can only see requests, and skip-driven synthesis never
 * touches a synthesis endpoint — it is reached through the ordinary skip route
 * and resolved by the loop. Applying this as route middleware therefore guarded
 * only the manual endpoint while skip-driven synthesis ran under the 60/hr
 * interview budget, roughly a 6x overspend. The real budget is charged in the
 * service by {@link chargeSynthesis}, at the point synthesis is actually invoked.
 */
const SYNTHESIS_WINDOW_MS = 60 * 60 * 1000;
const SYNTHESIS_LIMIT = isDev ? 100 : 10;

/** userId -> timestamps of synthesis charges still inside the window. */
const synthesisHits = new Map<string, number[]>();

function pruneExpired(now: number): void {
  for (const [userId, hits] of synthesisHits) {
    const live = hits.filter((at) => now - at < SYNTHESIS_WINDOW_MS);
    // Pruning only the user being charged would leave an entry behind for every
    // user who ever synthesized once, so the whole map is swept periodically.
    if (live.length === 0) synthesisHits.delete(userId);
    else synthesisHits.set(userId, live);
  }
}

let lastPrune = 0;

/**
 * Charges one synthesis call against `userId`'s hourly budget, throwing
 * {@link TooManyRequestsError} with a `Retry-After` once the budget is spent.
 */
export function chargeSynthesis(userId: string): void {
  const now = Date.now();
  // Drop expired charges so the map cannot grow without bound.
  const hits = (synthesisHits.get(userId) ?? []).filter((at) => now - at < SYNTHESIS_WINDOW_MS);

  if (hits.length >= SYNTHESIS_LIMIT) {
    const retryAfterSec = Math.ceil((SYNTHESIS_WINDOW_MS - (now - hits[0])) / 1000);
    synthesisHits.set(userId, hits);
    throw new TooManyRequestsError(
      `Synthesis limit reached. Try again in ${Math.max(1, retryAfterSec)}s.`,
      Math.max(1, retryAfterSec)
    );
  }

  if (now - lastPrune > SYNTHESIS_WINDOW_MS) {
    lastPrune = now;
    pruneExpired(now);
  }

  hits.push(now);
  synthesisHits.set(userId, hits);
}

/** Test hook: clears the in-process synthesis budget. */
export function resetSynthesisBudget(): void {
  synthesisHits.clear();
  lastPrune = 0;
}
