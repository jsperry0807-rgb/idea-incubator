import { describe, expect, it } from 'vitest';

import { appendAssumption, formatAssumption } from './assumptions';

/**
 * Deferring a question writes an assumption into `overview.md`. This is the
 * markdown surgery that must never eat hand-edited content.
 */

const OVERVIEW = `# Overview

## What It Is

A one-paragraph description the user wrote by hand.

## Who It's For

- Primary audience

## Design Principles

- Principle 1
`;

describe('formatAssumption', () => {
  it('uses the reason when given', () => {
    expect(formatAssumption('Art style', 'Assume pixel art for now')).toBe(
      '- Art style: Assume pixel art for now'
    );
  });

  it('falls back when the reason is empty or whitespace', () => {
    expect(formatAssumption('Art style')).toBe('- Art style: deferred without a reason');
    expect(formatAssumption('Art style', '   ')).toBe('- Art style: deferred without a reason');
  });
});

describe('appendAssumption', () => {
  it('creates the section when overview.md has none', () => {
    const result = appendAssumption(OVERVIEW, 'Art style', 'Assume pixel art');

    expect(result).toContain('## Assumptions');
    expect(result).toContain('- Art style: Assume pixel art');
    // Everything the user wrote survives.
    expect(result).toContain('A one-paragraph description the user wrote by hand.');
    expect(result).toContain('- Principle 1');
    expect(result.indexOf('## What It Is')).toBeLessThan(result.indexOf('## Assumptions'));
  });

  it('appends to an existing Assumptions section, preserving what follows', () => {
    const existing = `${OVERVIEW}
## Assumptions

- Monetization: assume ads first

## Design Principles

- Principle 1
`;
    const result = appendAssumption(existing, 'Art style', 'Assume pixel art');

    expect(result).toContain('- Monetization: assume ads first');
    expect(result).toContain('- Art style: Assume pixel art');
    // Order matters: the new entry lands after the old one.
    expect(result.indexOf('- Monetization')).toBeLessThan(result.indexOf('- Art style'));
    // And the section that follows is untouched.
    expect(result).toContain('## Design Principles\n\n- Principle 1\n');
  });

  it('appends to a trailing Assumptions section with nothing after it', () => {
    const existing = `${OVERVIEW}
## Assumptions

- Monetization: assume ads first
`;
    const result = appendAssumption(existing, 'Art style', 'Assume pixel art');

    expect(result).toContain('- Monetization: assume ads first');
    expect(result).toContain('- Art style: Assume pixel art');
    expect(result.trimEnd().endsWith('- Art style: Assume pixel art')).toBe(true);
  });

  it('does not treat a heading that merely mentions Assumptions as the section', () => {
    const existing = `${OVERVIEW}
## Open Questions About Assumptions

Some prose.
`;
    const result = appendAssumption(existing, 'Art style', 'Assume pixel art');

    // A real section is created rather than writing into the wrong block.
    expect(result).toContain('## Open Questions About Assumptions\n\nSome prose.');
    expect(result).toContain('\n## Assumptions\n\n- Art style: Assume pixel art');
  });

  it('is idempotent in shape: repeated defers each add a line', () => {
    const once = appendAssumption(OVERVIEW, 'Art style', 'First');
    const twice = appendAssumption(once, 'Monetization', 'Second');

    expect(twice.match(/^## Assumptions$/gm)).toHaveLength(1);
    expect(twice).toContain('- Art style: First');
    expect(twice).toContain('- Monetization: Second');
  });
});
