import { describe, expect, it } from 'vitest';

import { ensureUniqueSlug, slugify } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Cookie Tycoon')).toBe('cookie-tycoon');
  });

  it('strips accents', () => {
    expect(slugify('Café Simulator')).toBe('cafe-simulator');
  });

  it('falls back when nothing survives', () => {
    expect(slugify('!!!')).toBe('idea');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns the base when free', () => {
    expect(ensureUniqueSlug('cookie', [])).toBe('cookie');
  });

  it('suffixes on collision', () => {
    expect(ensureUniqueSlug('cookie', ['cookie'])).toBe('cookie-2');
  });

  it('skips gaps to avoid reusing a slug', () => {
    expect(ensureUniqueSlug('cookie', ['cookie', 'cookie-2'])).toBe('cookie-3');
  });
});
