import { describe, expect, it } from 'vitest';

import { notificationListQuerySchema } from '@repo/shared';

/**
 * Query strings are always strings, so `unread` needs explicit boolean parsing.
 * Regression: `z.coerce.boolean()` is `Boolean(value)`, and `Boolean('false')`
 * is `true` — so `?unread=false` returned unread-only, the exact opposite of
 * what was asked.
 */
describe('notificationListQuerySchema', () => {
  it('treats unread=false as false', () => {
    expect(notificationListQuerySchema.parse({ unread: 'false' })).toEqual({ unread: false });
  });

  it('treats unread=true as true', () => {
    expect(notificationListQuerySchema.parse({ unread: 'true' })).toEqual({ unread: true });
  });

  it('accepts other explicit boolean spellings', () => {
    for (const [raw, expected] of [
      ['1', true],
      ['0', false],
      ['yes', true],
      ['no', false],
    ] as const) {
      expect(notificationListQuerySchema.parse({ unread: raw }).unread).toBe(expected);
    }
  });

  it('leaves unread unset when absent', () => {
    expect(notificationListQuerySchema.parse({})).toEqual({});
  });

  it('rejects a non-boolean value instead of silently coercing it', () => {
    expect(notificationListQuerySchema.safeParse({ unread: 'maybe' }).success).toBe(false);
  });
});
