import { describe, expect, it } from 'vitest';

import { sectionsForType } from '../lib/planningTemplates';
import { InterviewAgent } from './graph';
import {
  CLICKER_GAME,
  NO_CHANGE,
  PHYSICAL_PRODUCT,
  SAAS_TOOL,
  traceClassify,
  tracePoint,
  traceQuestion,
  type SeedIdea,
} from './fixtures';
import { runTrace, type UserTurn } from './fixtures/trace-runner';
import type { TraceScript } from './fixtures/scripted-client';
import { STUCK_ATTEMPTS } from './state';

/**
 * Layer 2 of the testing strategy: golden traces as the executable spec.
 *
 * These assert BRANCH STRUCTURE, never wording — which points appear, in
 * priority order, what an answer opens and closes, when synthesis fires, and
 * which planning sections a decision grounds. Question prose is
 * non-deterministic across model versions and asserting it would make this suite
 * fail on unrelated changes.
 *
 * Runs with no API key: the scripted client stands in for the network while the
 * real prompt-build -> validate -> normalize -> reducer path executes.
 */

const point = tracePoint;
const question = traceQuestion;

/* ------------------------------------------------------------------ */
/* Seed 1: clicker-game — the worked branch from architecture.md        */
/* ------------------------------------------------------------------ */

const CLICKER_SCRIPT: TraceScript = {
  classify: traceClassify(
    'incremental-game',
    0.9,
    ['cookie', 'tapping', 'upgrades automate'],
    [
      point('core-loop', 'P0', ['mechanics', 'progression']),
      point('idle-vs-active', 'P1', ['mechanics']),
      point('monetization', 'P2', ['progression']),
    ]
  ),
  questions: [
    question('core-loop', ['pure-incremental', 'active-minigame', 'hybrid']),
    // Asked after the hybrid answer: the newly opened P0 outranks the P1/P2
    // frontier, which is the whole point of re-evaluation.
    question('upgrade-cadence', ['per-session', 'per-hour']),
  ],
  reevaluations: [
    {
      // The worked branch: hybrid opens points pure-incremental never reaches.
      opened: [
        point('upgrade-cadence', 'P0', ['mechanics', 'progression']),
        point('prestige-layer', 'P1', ['progression']),
        point('session-length', 'P2', ['progression']),
      ],
      closed: [],
      invalidated: [],
    },
  ],
  syntheses: [],
};

/**
 * The stuck path needs its own script: synthesis is reached by skipping the
 * *first* question twice, before any answer has moved the frontier on.
 */
const CLICKER_STUCK_SCRIPT: TraceScript = {
  classify: traceClassify(
    'incremental-game',
    0.9,
    ['cookie', 'tapping'],
    [
      point('core-loop', 'P0', ['mechanics', 'progression']),
      point('monetization', 'P1', ['progression']),
    ]
  ),
  questions: [
    question('core-loop', ['pure-incremental', 'hybrid']),
    // The re-ask after the first skip renders the SAME point again.
    question('core-loop', ['pure-incremental', 'hybrid']),
    // Once core-loop resolves, monetization is all that is left to ask.
    question('monetization', ['ads', 'iap']),
  ],
  reevaluations: [NO_CHANGE],
  syntheses: [
    {
      recommendation: 'Ship the hybrid loop: idle taps plus one prestige layer.',
      keyTradeoffs: ['More systems to balance', 'Prestige is a second onboarding curve'],
      strongestDisagreement: 'A pure incremental loop is cheaper to build and test first.',
      forPointId: 'core-loop',
    },
  ],
};

const CLICKER_TURNS: UserTurn[] = [{ kind: 'answer', optionId: 'hybrid' }];
const STUCK_TURNS: UserTurn[] = [
  { kind: 'skip' },
  { kind: 'skip' },
  { kind: 'answer', optionId: 'hybrid' },
];

describe('golden trace: clicker-game (GAME)', () => {
  it('opens prestige points on the hybrid answer that pure-incremental never reaches', async () => {
    const trace = await runTrace(CLICKER_GAME, CLICKER_SCRIPT, CLICKER_TURNS);

    expect(trace.openedByTurn[0]).toEqual(['upgrade-cadence', 'prestige-layer', 'session-length']);
    // Newly opened P0 upgrade-cadence outranks the leftover P1/P2 frontier.
    expect(trace.askedLabels).toEqual(['core-loop', 'upgrade-cadence']);
  });

  it('keeps the untouched frontier after the branch', async () => {
    const trace = await runTrace(CLICKER_GAME, CLICKER_SCRIPT, CLICKER_TURNS);
    expect(trace.frontierAfterTurn[0]).toEqual([
      'idle-vs-active',
      'monetization',
      'upgrade-cadence',
      'prestige-layer',
      'session-length',
    ]);
  });

  it(`synthesizes only after ${STUCK_ATTEMPTS} skips on one point, then resumes`, async () => {
    const trace = await runTrace(CLICKER_GAME, CLICKER_STUCK_SCRIPT, STUCK_TURNS);

    // The same point is re-asked after the first skip, which is what makes a
    // second skip on it reachable at all.
    expect(trace.askedLabels[0]).toBe('core-loop');
    expect(trace.askedLabels[1]).toBe('core-loop');

    // First skip alone must not synthesize.
    const afterOne = await runTrace(CLICKER_GAME, CLICKER_STUCK_SCRIPT, [{ kind: 'skip' }]);
    expect(afterOne.synthesizedAtTurn).toBeNull();
    expect(afterOne.client.calls.some((c) => c.kind === 'synthesize')).toBe(false);

    // Second skip on the same point trips the threshold.
    expect(trace.synthesizedAtTurn).toBe(1);
    expect(trace.client.calls.filter((c) => c.kind === 'synthesize')).toHaveLength(1);

    // Parked on the verdict, then back to dialog once the point is answered.
    expect(trace.phaseAfterTurn[1]).toBe('SYNTHESIZE');
    expect(trace.final.phase).toBe('ASK');
    expect(trace.final.stuck).toBeNull();

    // The verdict stays pinned to the point that was stuck, and carries all
    // three parts of the 3-bullet format.
    const coreLoopId = InterviewAgent.pointId('core-loop', CLICKER_GAME.projectType);
    expect(trace.final.synthesis?.forPointId).toBe(coreLoopId);
    expect(trace.final.synthesis?.recommendation).toBeTruthy();
    expect(trace.final.synthesis?.keyTradeoffs.length).toBeGreaterThan(0);
    expect(trace.final.synthesis?.strongestDisagreement).toBeTruthy();

    // With core-loop resolved, the only point left to ask is monetization.
    expect(trace.askedLabels.at(-1)).toBe('monetization');
  });

  it('grounds the sections the resolved decision blocked', async () => {
    const trace = await runTrace(CLICKER_GAME, CLICKER_STUCK_SCRIPT, STUCK_TURNS);

    const coreLoopDecision = Object.values(trace.final.decisions).find((d) =>
      d.blocks.includes('mechanics')
    );
    expect(coreLoopDecision?.blocks).toEqual(['mechanics', 'progression']);

    // mechanics/progression are no longer blocked by an open point, so both
    // are grounded; monetization still blocks progression.
    expect(trace.final.coverage.mechanics).toBe(1);
    expect(trace.final.coverage.progression).toBe(0);
  });

  it('routes synthesis to the configured stronger model and nothing else', async () => {
    const trace = await runTrace(CLICKER_GAME, CLICKER_STUCK_SCRIPT, STUCK_TURNS, {
      synthesisModel: 'strong-model',
    });

    for (const call of trace.client.calls) {
      expect(call.model).toBe(call.kind === 'synthesize' ? 'strong-model' : undefined);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Seed 2: saas-tool — a different frontier, proving domain sensitivity */
/* ------------------------------------------------------------------ */

const SAAS_SCRIPT: TraceScript = {
  classify: traceClassify(
    'b2b-saas',
    0.85,
    ['dashboard', 'usage data', 'churn'],
    [
      point('data-source', 'P0', ['tech-stack']),
      point('alert-threshold', 'P1', ['features']),
      point('pricing-model', 'P2', ['timeline']),
    ]
  ),
  questions: [
    question('data-source', ['warehouse', 'sampled']),
    question('connector-scope', ['one-connector', 'all-warehouse']),
  ],
  reevaluations: [
    {
      // Warehouse-only is a different product than sampling: it opens work.
      opened: [point('connector-scope', 'P0', ['tech-stack'])],
      closed: [],
      invalidated: [],
    },
  ],
  syntheses: [],
};

describe('golden trace: saas-tool (SAAS)', () => {
  it("branches on the data source and never reuses the game's frontier", async () => {
    const trace = await runTrace(SAAS_TOOL, SAAS_SCRIPT, [
      { kind: 'answer', optionId: 'warehouse' },
    ]);

    expect(trace.openedByTurn[0]).toEqual(['connector-scope']);
    expect(trace.askedLabels).toEqual(['data-source', 'connector-scope']);

    const labels = trace.final.open.map((p) => p.id).join(' ');
    expect(labels).not.toMatch(/prestige|cookie|upgrade-cadence/);
  });

  it('grounds SAAS sections, not the GAME section set', async () => {
    const trace = await runTrace(SAAS_TOOL, SAAS_SCRIPT, [
      { kind: 'answer', optionId: 'warehouse' },
    ]);

    const required = sectionsForType('SAAS').created;
    expect(required).toContain('tech-stack');
    expect(required).not.toContain('mechanics');

    const decision = Object.values(trace.final.decisions)[0];
    expect(decision.blocks).toEqual(['tech-stack']);
  });
});

/* ------------------------------------------------------------------ */
/* Seed 3: physical-product — a third section set                       */
/* ------------------------------------------------------------------ */

const PHYSICAL_SCRIPT: TraceScript = {
  classify: traceClassify(
    'physical-goods',
    0.8,
    ['kettle', 'thermometer', 'pour-over'],
    [
      point('heating-element', 'P0', ['tech-stack', 'features']),
      point('capacity', 'P1', ['features']),
      point('packaging', 'P2', ['supply-chain']),
    ]
  ),
  questions: [
    question('heating-element', ['single', 'dual']),
    question('packaging', ['box', 'mailer']),
  ],
  reevaluations: [
    {
      // A single element invalidates the dual-boiler plan outright.
      opened: [],
      closed: [],
      invalidated: ['dual-boiler'],
    },
  ],
  syntheses: [],
};

describe('golden trace: physical-product (PHYSICAL)', () => {
  it('invalidates the path the answer rules out and records it on the decision', async () => {
    const trace = await runTrace(PHYSICAL_PRODUCT, PHYSICAL_SCRIPT, [
      { kind: 'answer', optionId: 'single' },
    ]);

    const decision = Object.values(trace.final.decisions)[0];
    expect(decision.closedPointIds).toEqual(['dual-boiler']);
    expect(trace.final.open.map((p) => p.id)).not.toContain('dual-boiler');
  });

  it('grounds the PHYSICAL section set', async () => {
    const trace = await runTrace(PHYSICAL_PRODUCT, PHYSICAL_SCRIPT, [
      { kind: 'answer', optionId: 'single' },
    ]);

    const required = sectionsForType('PHYSICAL').created;
    expect(required).toContain('supply-chain');
    expect(required).not.toContain('progression');

    const decision = Object.values(trace.final.decisions)[0];
    expect(decision.blocks).toEqual(['tech-stack', 'features']);
  });
});

/* ------------------------------------------------------------------ */
/* Cross-seed invariants                                               */
/* ------------------------------------------------------------------ */

const SEEDS: Array<{ seed: SeedIdea; script: TraceScript; turns: UserTurn[] }> = [
  { seed: CLICKER_GAME, script: CLICKER_SCRIPT, turns: CLICKER_TURNS },
  {
    seed: SAAS_TOOL,
    script: SAAS_SCRIPT,
    turns: [{ kind: 'answer', optionId: 'warehouse' }],
  },
  {
    seed: PHYSICAL_PRODUCT,
    script: PHYSICAL_SCRIPT,
    turns: [{ kind: 'answer', optionId: 'single' }],
  },
];

describe('golden trace invariants (all seeds)', () => {
  it.each(SEEDS)(
    '$seed.id keeps every frontier point eliminating a path',
    async ({ seed, script, turns }) => {
      const trace = await runTrace(seed, script, turns);
      for (const p of trace.final.open) {
        expect(p.eliminatesPaths.length).toBeGreaterThan(0);
      }
    }
  );

  it.each(SEEDS)('$seed.id classifies exactly once', async ({ seed, script, turns }) => {
    const trace = await runTrace(seed, script, turns);
    expect(trace.client.calls.filter((c) => c.kind === 'classify')).toHaveLength(1);
  });

  it.each(SEEDS)('$seed.id ends in a resumable phase', async ({ seed, script, turns }) => {
    const trace = await runTrace(seed, script, turns);
    expect(['ASK', 'READY', 'SYNTHESIZE']).toContain(trace.final.phase);
    // A parked phase always carries the verdict that parked it.
    if (trace.final.phase === 'SYNTHESIZE') {
      expect(trace.final.synthesis).not.toBeNull();
    }
  });
});
