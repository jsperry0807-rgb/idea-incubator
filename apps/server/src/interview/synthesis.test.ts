import { afterEach, describe, expect, it } from 'vitest';

import type { Synthesis } from '@repo/shared';

import { ConflictError, NotFoundError, TooManyRequestsError } from '../lib/errors';
import { InterviewAgent } from './graph';
import { runLoop } from './loop';
import type { InterviewState } from './state';
import { chargeSynthesis, resetSynthesisBudget } from '../middleware/rateLimit';
import { CLICKER_GAME, traceClassify, tracePoint, traceQuestion } from './fixtures';
import { initialState, runTrace, type UserTurn } from './fixtures/trace-runner';
import type { TraceScript } from './fixtures/scripted-client';
import {
  buildSynthesisMessages,
  normalizeSynthesisOutput,
  synthesisOutputSchema,
} from './prompts/synthesis';

/**
 * The synthesis node: a 3-bullet verdict (Recommendation / Key Tradeoffs /
 * Strongest Disagreement) against our own LlmClient, replacing the ported
 * `brainstorm-mcp` orchestration.
 */

const CORE_LOOP = tracePoint('core-loop', 'P0', ['mechanics', 'progression']);

const VERDICT: Synthesis = {
  recommendation: 'Ship the hybrid loop.',
  keyTradeoffs: ['More systems to balance', 'Second onboarding curve'],
  strongestDisagreement: 'Pure incremental is cheaper to validate first.',
  forPointId: 'core-loop',
};

/** Minimal script: one point, skipped twice, then a verdict. */
function stuckScript(): TraceScript {
  return {
    classify: traceClassify('incremental-game', 0.9, ['cookie'], [CORE_LOOP]),
    questions: [
      traceQuestion('core-loop', ['pure-incremental', 'hybrid']),
      traceQuestion('core-loop', ['pure-incremental', 'hybrid']),
    ],
    reevaluations: [],
    syntheses: [VERDICT],
  };
}

const SKIP_TWICE: UserTurn[] = [{ kind: 'skip' }, { kind: 'skip' }];

describe('synthesis prompt', () => {
  const state = {
    ...initialState(CLICKER_GAME),
    open: [CORE_LOOP],
    domain: {
      primary: 'incremental-game',
      confidence: 0.9,
      signals: ['cookie'],
    },
  };

  it("asks for exactly the three verdict parts, in the user's language", () => {
    const messages = buildSynthesisMessages(state, 'core-loop', 'es');
    const system = messages.find((m) => m.role === 'system')?.content ?? '';

    expect(system).toContain('recommendation');
    expect(system).toContain('keyTradeoffs');
    expect(system).toContain('strongestDisagreement');
    expect(system).toContain('Respond in es.');
  });

  it('grounds the prompt in the stuck point and the decision log', () => {
    const withDecision = {
      ...state,
      decisions: {
        'monetization-1111': {
          pointId: 'monetization-1111',
          optionId: 'ads',
          value: 'ads first',
          openedPointIds: [],
          closedPointIds: [],
          deferred: false,
          blocks: ['progression' as const],
          at: '2026-01-01T00:00:00.000Z',
        },
      },
    };
    const user =
      buildSynthesisMessages(withDecision, 'core-loop', 'en').find((m) => m.role === 'user')
        ?.content ?? '';

    expect(user).toContain('core-loop');
    expect(user).toContain('core loop');
    expect(user).toContain('monetization-1111');
    expect(user).toContain('ads first');
  });

  it('validates against the shared Synthesis schema', () => {
    expect(synthesisOutputSchema.safeParse(VERDICT).success).toBe(true);
    // A verdict with no tradeoffs is not a verdict.
    expect(synthesisOutputSchema.safeParse({ ...VERDICT, keyTradeoffs: [] }).success).toBe(false);
  });

  it('pins the verdict to the requested point whatever the model returns', () => {
    expect(
      normalizeSynthesisOutput({ ...VERDICT, forPointId: 'some-other' }, 'core-loop').forPointId
    ).toBe('core-loop');
  });
});

describe('synthesis via the agent', () => {
  it('resolves a synthesize directive to a SYNTHESIZED event', async () => {
    const agent = new InterviewAgent(
      {
        async complete() {
          throw new Error('no http in tests');
        },
        async completeStructured() {
          return { ...VERDICT, forPointId: 'wrong-point' } as never;
        },
      },
      'en',
      { synthesisModel: 'strong-model' }
    );

    // The resolver guards on phase and on the point being open, so this needs a
    // state that has actually classified — a bare CLASSIFY state has no frontier.
    const state: InterviewState = {
      ...initialState(CLICKER_GAME),
      phase: 'SYNTHESIZE',
      domain: { primary: 'incremental-game', confidence: 0.9, signals: ['cookie'] },
      open: [{ ...CORE_LOOP, id: 'core-loop' }],
    };

    const event = await agent.resolve(state, {
      type: 'synthesize',
      pointId: 'core-loop',
    });

    expect(event).toEqual({
      type: 'SYNTHESIZED',
      forPointId: 'core-loop',
      // normalizeSynthesisOutput overrode the model's own point id.
      synthesis: VERDICT,
    });
  });

  it('refuses to synthesize a point that is not open', async () => {
    const agent = new InterviewAgent(
      {
        async complete() {
          throw new Error('no http in tests');
        },
        async completeStructured() {
          throw new Error('should not reach the model');
        },
      },
      'en'
    );

    const state: InterviewState = {
      ...initialState(CLICKER_GAME),
      phase: 'SYNTHESIZE',
      open: [],
    };

    await expect(
      agent.resolve(state, { type: 'synthesize', pointId: 'core-loop' })
    ).rejects.toThrow(NotFoundError);
  });

  it('refuses to synthesize a finished interview', async () => {
    const agent = new InterviewAgent(
      {
        async complete() {
          throw new Error('no http in tests');
        },
        async completeStructured() {
          throw new Error('should not reach the model');
        },
      },
      'en'
    );

    const state: InterviewState = {
      ...initialState(CLICKER_GAME),
      phase: 'DONE',
      open: [{ ...CORE_LOOP, id: 'core-loop' }],
    };

    await expect(
      agent.resolve(state, { type: 'synthesize', pointId: 'core-loop' })
    ).rejects.toThrow(ConflictError);
  });

  it('routes the stronger model to synthesis and nowhere else', async () => {
    const trace = await runTrace(CLICKER_GAME, stuckScript(), SKIP_TWICE, {
      synthesisModel: 'strong-model',
    });

    expect(trace.client.calls.length).toBeGreaterThan(1);
    for (const call of trace.client.calls) {
      expect(call.model).toBe(call.kind === 'synthesize' ? 'strong-model' : undefined);
    }
  });

  it('parks the interview on the verdict instead of finishing it', async () => {
    const trace = await runTrace(CLICKER_GAME, stuckScript(), SKIP_TWICE);
    const coreLoopId = InterviewAgent.pointId('core-loop', CLICKER_GAME.projectType);

    expect(trace.synthesizedAtTurn).toBe(1);
    expect(trace.final.phase).toBe('SYNTHESIZE');
    // Parked, not decided: the point is still open and the user has the last word.
    expect(trace.final.open.map((p) => p.id)).toEqual([coreLoopId]);
    expect(trace.final.synthesis).toEqual({
      ...VERDICT,
      forPointId: coreLoopId,
    });
    expect(trace.final.stuck).toEqual({ pointId: coreLoopId, attempts: 2 });
  });

  it('returns to dialog when the user answers the stuck point', async () => {
    const script = stuckScript();
    // Leave a second point open so answering core-loop resumes the interview
    // rather than completing it.
    script.classify.open.push(tracePoint('monetization', 'P1', ['progression']));
    script.questions.push(traceQuestion('monetization', ['ads', 'iap']));
    script.reevaluations = [{ opened: [], closed: [], invalidated: [] }];

    const trace = await runTrace(CLICKER_GAME, script, [
      ...SKIP_TWICE,
      { kind: 'answer', optionId: 'hybrid' },
    ]);

    expect(trace.final.phase).toBe('ASK');
    expect(trace.final.stuck).toBeNull();
    // The verdict stays on file after the point is resolved.
    expect(trace.final.synthesis).not.toBeNull();
    expect(trace.askedLabels.at(-1)).toBe('monetization');
  });
});

describe('synthesis budget is charged where synthesis happens', () => {
  afterEach(() => {
    resetSynthesisBudget();
  });

  /**
   * Regression for the overspend: skip-driven synthesis is reached through the
   * ordinary skip route and resolved by the loop, so a limiter mounted only on
   * the manual synthesis endpoint never saw those calls and they ran under the
   * 60/hr interview budget.
   */
  it('charges the budget when the loop resolves a skip-driven synthesis', async () => {
    for (let i = 0; i < 10; i++) chargeSynthesis('owner-1');

    const agent = new InterviewAgent(
      {
        async complete() {
          throw new Error('no http in tests');
        },
        async completeStructured() {
          return VERDICT as never;
        },
      },
      'en'
    );

    const state: InterviewState = {
      ...initialState(CLICKER_GAME),
      phase: 'ASK',
      open: [{ ...CORE_LOOP, id: 'core-loop' }],
      asked: ['core-loop'],
      current: {
        point: { ...CORE_LOOP, id: 'core-loop' },
        prompt: 'How?',
        why: CORE_LOOP.why,
        options: [{ id: 'hybrid', label: 'Hybrid', consequence: 'Mixed' }],
        canSkip: true,
      },
      stuck: { pointId: 'core-loop', attempts: 1 },
    };

    await expect(
      runLoop(agent, state, [{ type: 'SKIPPED', pointId: 'core-loop' }], {
        budgetOwner: 'owner-1',
      })
    ).rejects.toThrow(TooManyRequestsError);
  });

  it('does not spend a budget when no owner is supplied', async () => {
    for (let i = 0; i < 10; i++) chargeSynthesis('owner-1');

    const agent = new InterviewAgent(
      {
        async complete() {
          throw new Error('no http in tests');
        },
        async completeStructured() {
          return VERDICT as never;
        },
      },
      'en'
    );

    const state: InterviewState = {
      ...initialState(CLICKER_GAME),
      phase: 'SYNTHESIZE',
      open: [{ ...CORE_LOOP, id: 'core-loop' }],
      stuck: { pointId: 'core-loop', attempts: 2 },
    };

    // The trace driver replays fixtures and must not spend a real budget.
    const result = await runLoop(agent, state, [
      { type: 'SYNTHESIZED', forPointId: 'core-loop', synthesis: VERDICT },
    ]);

    expect(result.state.synthesis).toEqual(VERDICT);
    expect(() => chargeSynthesis('owner-1')).toThrow(TooManyRequestsError);
  });
});

/**
 * QA from the roadmap: the synthesis latency budget is under 6s.
 *
 * Asserted against the scripted client so it holds in CI with no key: what
 * this actually verifies is that reaching a verdict costs exactly ONE model
 * call — no retry storm, no re-ask loop — which is what keeps the call inside
 * the budget. A live measurement is `interview:regenerate-fixtures`.
 */
const SYNTHESIS_BUDGET_MS = 6000;

describe('synthesis latency budget', () => {
  it(`reaches a verdict in one model call, well inside ${SYNTHESIS_BUDGET_MS}ms`, async () => {
    const started = Date.now();
    const trace = await runTrace(CLICKER_GAME, stuckScript(), SKIP_TWICE);
    const elapsed = Date.now() - started;

    // The skip that trips synthesis costs the verdict call and nothing else.
    const synthesisCalls = trace.client.calls.filter((c) => c.kind === 'synthesize');
    expect(synthesisCalls).toHaveLength(1);

    // 1 classify + 2 asks + 1 verdict, with zero retries.
    expect(trace.client.calls).toHaveLength(4);
    expect(elapsed).toBeLessThan(SYNTHESIS_BUDGET_MS);
  });

  it('does not re-ask the stuck point after the verdict', async () => {
    const trace = await runTrace(CLICKER_GAME, stuckScript(), SKIP_TWICE);

    // Two asks total: the original and the one re-ask. Synthesis stops the
    // loop, so there is no third.
    expect(trace.client.calls.filter((c) => c.kind === 'ask')).toHaveLength(2);
    expect(trace.client.calls.at(-1)?.kind).toBe('synthesize');
  });
});

describe('runLoop guards', () => {
  it('stops at maxSteps instead of looping forever', async () => {
    let calls = 0;
    const agent = new InterviewAgent(
      {
        async complete() {
          throw new Error('no http in tests');
        },
        async completeStructured() {
          calls++;
          return traceQuestion('core-loop', ['a', 'b']) as never;
        },
      },
      'en'
    );

    // Skipping re-asks the same point by design; the step cap is what stops a
    // pathological client from looping forever.
    const result = await runLoop(
      agent,
      { ...initialState(CLICKER_GAME), phase: 'ASK', open: [CORE_LOOP] },
      [{ type: 'SKIPPED', pointId: 'core-loop' }],
      { maxSteps: 5 }
    );

    expect(result.events.length).toBeLessThanOrEqual(5);
    expect(calls).toBeLessThanOrEqual(5);
  });
});
