import { advance, type Answer, type InterviewDirective, type InterviewEvent } from './reducer';
import type { InterviewAgent } from './graph';
import type { InterviewState } from './state';
import { chargeSynthesis } from '../middleware/rateLimit';
import { LlmTimeoutError } from '../lib/errors';

/** Guard against a resolver that keeps emitting events. */
export const MAX_PUMP_STEPS = 100;

/**
 * Wall-clock ceiling for one pump. Each directive may make a model call, so
 * bounding steps alone still allows a run to take `steps * timeout`. This
 * bounds the request as a whole.
 */
export const MAX_LOOP_DURATION_MS = 120_000;

export type LoopTerminal = 'none' | 'ready' | 'turn-cap' | 'needs-synthesis';

export interface LoopResult {
  state: InterviewState;
  terminal: LoopTerminal;
  /** Every event applied, in order — used by trace tooling to replay a run. */
  events: InterviewEvent[];
}

export interface LoopOptions {
  maxSteps?: number;
  /** Called after each event is applied, before its directives are resolved. */
  onEvent?: (event: InterviewEvent, state: InterviewState) => void;
  /**
   * Identity the synthesis budget is charged to. Supplied by the HTTP service.
   * Omitted by the trace driver, which replays fixtures and must not spend a
   * real budget.
   */
  budgetOwner?: string;
  /** Wall-clock ceiling; defaults to {@link MAX_LOOP_DURATION_MS}. */
  maxDurationMs?: number;
}

/**
 * Runs the reducer until it settles, resolving model-requiring directives
 * through the {@link InterviewAgent}.
 *
 * This is the single execution loop shared by the HTTP service and the golden
 * trace driver, so a trace exercises exactly the code the API runs.
 */
export async function runLoop(
  agent: InterviewAgent,
  state: InterviewState,
  initialEvents: InterviewEvent[],
  options: LoopOptions = {}
): Promise<LoopResult> {
  const maxSteps = options.maxSteps ?? MAX_PUMP_STEPS;
  const deadline = Date.now() + (options.maxDurationMs ?? MAX_LOOP_DURATION_MS);
  let s = state;
  const queue: InterviewEvent[] = [...initialEvents];
  const events: InterviewEvent[] = [];
  let steps = 0;
  let terminal: LoopTerminal = 'none';

  while (queue.length > 0 && steps < maxSteps) {
    const event = queue.shift()!;
    events.push(event);
    const result = advance(s, event);
    s = result.state;
    options.onEvent?.(event, s);

    for (const directive of result.directives) {
      if (directive.type === 'complete') {
        terminal = directive.reason === 'turn-cap' ? 'turn-cap' : 'ready';
        continue;
      }
      if (directive.type === 'synthesize') {
        terminal = 'needs-synthesis';
        // Charge here, not in route middleware: this is the only path that
        // actually spends a synthesis call, and it is reached by skip-driven
        // synthesis as well as the manual endpoint.
        if (options.budgetOwner) chargeSynthesis(options.budgetOwner);
      }

      if (Date.now() > deadline) {
        throw new LlmTimeoutError(
          `Interview exceeded its ${Math.round((options.maxDurationMs ?? MAX_LOOP_DURATION_MS) / 1000)}s budget`
        );
      }

      const resolved = await agent.resolve(s, directive);
      if (resolved) {
        queue.push(resolved);
      }
    }
    steps++;
  }

  return { state: s, terminal, events };
}

export type { Answer, InterviewDirective, InterviewEvent };
