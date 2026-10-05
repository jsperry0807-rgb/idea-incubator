import { afterEach, describe, expect, it } from 'vitest';

import { TooManyRequestsError } from '../lib/errors';
import { chargeSynthesis, resetSynthesisBudget } from './rateLimit';

/**
 * The synthesis budget is charged where synthesis is actually invoked rather
 * than as route middleware. Regression coverage for the overspend that motivated
 * it: skip-driven synthesis reaches the model through the ordinary skip route,
 * so a middleware-only limiter never saw those calls.
 */
describe('synthesis budget', () => {
  afterEach(() => {
    resetSynthesisBudget();
  });

  it('allows charges below the limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(() => chargeSynthesis('user-1')).not.toThrow();
    }
  });

  it('throws a 429 with a retry hint once the budget is spent', () => {
    for (let i = 0; i < 10; i++) chargeSynthesis('user-1');

    let thrown: unknown;
    try {
      chargeSynthesis('user-1');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(TooManyRequestsError);
    expect((thrown as TooManyRequestsError).statusCode).toBe(429);
    expect((thrown as TooManyRequestsError).retryAfterSec).toBeGreaterThan(0);
  });

  it('budgets per user so one user cannot exhaust another', () => {
    for (let i = 0; i < 10; i++) chargeSynthesis('user-1');

    expect(() => chargeSynthesis('user-2')).not.toThrow();
  });

  it('rejects an exhausted user without spending more budget', () => {
    for (let i = 0; i < 10; i++) chargeSynthesis('user-1');
    expect(() => chargeSynthesis('user-1')).toThrow(TooManyRequestsError);

    // A rejected charge must not push the window forward, so the retry hint
    // stays anchored to the oldest live charge.
    let retryAfter = 0;
    try {
      chargeSynthesis('user-1');
    } catch (error) {
      retryAfter = (error as TooManyRequestsError).retryAfterSec;
    }
    expect(retryAfter).toBeGreaterThan(0);
  });
});
