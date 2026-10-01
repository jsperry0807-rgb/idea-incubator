import { InterviewAgent } from '../graph';
import { runLoop } from '../loop';
import { advance, type Answer, type InterviewEvent } from '../reducer';
import { emptyCoverage, type InterviewPhase, type InterviewState } from '../state';
import { ScriptedTraceClient, type TraceScript } from './scripted-client';
import type { SeedIdea } from './index';

/**
 * Golden-trace driver: replays a fixed sequence of user turns through the real
 * `runLoop` (the same loop the HTTP service runs) and records the branch
 * structure that resulted.
 */

export type UserTurn =
  | { kind: 'answer'; optionId: string; freeText?: string | null }
  | { kind: 'skip' }
  | { kind: 'defer'; reason?: string };

export interface TraceRecord {
  /** Point label per asked question, in ask order. */
  askedLabels: string[];
  /** Frontier label order after each user turn. */
  frontierAfterTurn: string[][];
  /** Point labels each answer opened. */
  openedByTurn: string[][];
  /** Point labels each turn closed. */
  closedByTurn: string[][];
  /** Turn index at which a synthesis verdict was produced, if any. */
  synthesizedAtTurn: number | null;
  /** Phase after each user turn. */
  phaseAfterTurn: InterviewPhase[];
  final: InterviewState;
  client: ScriptedTraceClient;
}

export function initialState(seed: SeedIdea): InterviewState {
  return {
    idea: {
      id: seed.id,
      title: seed.title,
      description: seed.description,
      projectType: seed.projectType,
    },
    domain: null,
    decisions: {},
    open: [],
    asked: [],
    stuck: null,
    current: null,
    synthesis: null,
    coverage: emptyCoverage(),
    phase: 'CLASSIFY',
    turn: 0,
  };
}

/** Strips the id hash so traces read in terms of the authored labels. */
function labelOf(id: string): string {
  return id.replace(/-[a-f0-9]{4}$/, '');
}

export async function runTrace(
  seed: SeedIdea,
  script: TraceScript,
  turns: UserTurn[],
  opts: { locale?: string; synthesisModel?: string } = {}
): Promise<TraceRecord> {
  const client = new ScriptedTraceClient(script);
  const agent = new InterviewAgent(client, opts.locale ?? 'en', {
    ...(opts.synthesisModel ? { synthesisModel: opts.synthesisModel } : {}),
  });

  const record: TraceRecord = {
    askedLabels: [],
    frontierAfterTurn: [],
    openedByTurn: [],
    closedByTurn: [],
    synthesizedAtTurn: null,
    phaseAfterTurn: [],
    final: initialState(seed),
    client,
  };

  let state = initialState(seed);

  // Opening move: classify, then the first question renders.
  const opened = await runLoop(agent, state, [{ type: 'START' }]);
  state = opened.state;
  record.askedLabels.push(labelOf(state.current!.point.id));

  for (const [index, turn] of turns.entries()) {
    const point = state.current?.point;
    if (!point) break;

    const events: InterviewEvent[] =
      turn.kind === 'answer'
        ? [
            {
              type: 'ANSWERED',
              answer: {
                pointId: point.id,
                optionId: turn.optionId,
                value: turn.optionId,
                freeText: turn.freeText ?? null,
              } satisfies Answer,
            },
          ]
        : turn.kind === 'skip'
          ? [{ type: 'SKIPPED', pointId: point.id }]
          : [{ type: 'DEFERRED', pointId: point.id, reason: turn.reason }];

    const result = await runLoop(agent, state, events);
    state = result.state;

    const decision = state.decisions[point.id];
    record.openedByTurn.push((decision?.openedPointIds ?? []).map(labelOf));
    record.closedByTurn.push((decision?.closedPointIds ?? []).map(labelOf));
    record.frontierAfterTurn.push(state.open.map((p) => labelOf(p.id)));
    record.phaseAfterTurn.push(state.phase);

    if (state.synthesis && record.synthesizedAtTurn === null) {
      record.synthesizedAtTurn = index;
    }
    if (state.current) {
      record.askedLabels.push(labelOf(state.current.point.id));
    }
  }

  record.final = state;
  return record;
}

export { advance };
