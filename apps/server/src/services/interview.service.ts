import type { Prisma } from '../generated/prisma/client';
import prisma from '../lib/prisma';
import {
  AppError,
  ConflictError,
  LlmTimeoutError,
  NotFoundError,
  ValidationError,
} from '../lib/errors';
import { assertIdeaOwnership, loadOwnedIdea } from './idea.service';
import { llm } from './llm.service';
import { storage } from './storage.service';
import { env } from '../config/env';
import { InterviewAgent } from '../interview/graph';
import { appendAssumption } from '../interview/assumptions';
import { runLoop, type LoopTerminal } from '../interview/loop';
import { chargeSynthesis } from '../middleware/rateLimit';
import type { Answer, InterviewEvent } from '../interview/reducer';
import { emptyCoverage, type InterviewState } from '../interview/state';
import type { AnswerInterviewInput, SynthesisRequestInput } from '@repo/shared';

type JsonState = Prisma.InputJsonValue;

export interface InterviewResult {
  interviewId: string;
  created: boolean;
  state: InterviewState;
  terminal: LoopTerminal;
}

function createInitialState(
  ideaId: string,
  title: string | null,
  description: string | null,
  projectType: Awaited<ReturnType<typeof assertIdeaOwnership>>
): InterviewState {
  return {
    idea: {
      id: ideaId,
      title: title ?? 'Untitled idea',
      description,
      projectType,
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

interface LoadedInterview {
  id: string;
  version: number;
  state: InterviewState;
}

async function loadInterview(userId: string, ideaId: string): Promise<LoadedInterview> {
  const interview = await prisma.interview.findFirst({
    where: { ideaId, userId },
    select: { id: true, version: true, state: true },
  });

  if (!interview) {
    throw new NotFoundError('Interview not found. Start it with POST /interview.');
  }

  return {
    id: interview.id,
    version: interview.version,
    state: interview.state as unknown as InterviewState,
  };
}

/**
 * Builds the agent for a request. Synthesis routes to the stronger model when
 * one is configured; question prose and classification stay on the cheap model.
 */
function createAgent(locale: string): InterviewAgent {
  return new InterviewAgent(llm, locale, {
    ...(env.LLM_SYNTHESIS_MODEL ? { synthesisModel: env.LLM_SYNTHESIS_MODEL } : {}),
  });
}

/** Runs the reducer until it settles (no more directives needing a model call). */
async function pump(
  agent: InterviewAgent,
  state: InterviewState,
  initialEvents: InterviewEvent[],
  budgetOwner: string
): Promise<{ state: InterviewState; terminal: LoopTerminal }> {
  const { state: next, terminal } = await runLoop(agent, state, initialEvents, { budgetOwner });
  return { state: next, terminal };
}

/**
 * Starts (idempotent resume) the interview for an idea.
 *
 * Owner-only by design: interview state embeds the raw idea text, so VIEW/EDIT
 * collaborators are never allowed here (see `api.md`).
 */
export async function startOrResumeInterview(
  userId: string,
  ideaId: string,
  locale: string
): Promise<InterviewResult> {
  const idea = await loadOwnedIdea(userId, ideaId);

  // Selects what `loadInterview` returns, but tolerates absence: starting is not
  // an error when no interview exists yet, so this must not throw.
  const existing = await prisma.interview.findFirst({
    where: { ideaId, userId },
    select: { id: true, version: true, state: true },
  });

  if (existing) {
    const state = existing.state as unknown as InterviewState;
    // Crash-safe resume: finish a START that never classified.
    if (state.phase === 'CLASSIFY' && state.turn === 0 && state.open.length === 0) {
      const agent = createAgent(locale);
      const result = await pump(agent, state, [{ type: 'START' }], userId);
      const interview = await persist(existing.id, userId, result.state, existing.version);
      return {
        interviewId: interview.id,
        created: false,
        state: result.state,
        terminal: result.terminal,
      };
    }
    return {
      interviewId: existing.id,
      created: false,
      state,
      terminal: 'none',
    };
  }

  const initialState = createInitialState(idea.id, idea.title, idea.description, idea.projectType);

  const agent = createAgent(locale);
  const result = await pump(agent, initialState, [{ type: 'START' }], userId);

  const interview = await prisma.interview.create({
    data: {
      ideaId,
      userId,
      phase: result.state.phase,
      state: result.state as unknown as JsonState,
    },
  });

  return {
    interviewId: interview.id,
    created: true,
    state: result.state,
    terminal: result.terminal,
  };
}

export async function getInterviewState(userId: string, ideaId: string): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const interview = await prisma.interview.findFirst({
    where: { ideaId, userId },
  });
  if (!interview) {
    throw new NotFoundError('Interview not found. Start it with POST /interview.');
  }
  const state = interview.state as unknown as InterviewState;
  return {
    interviewId: interview.id,
    created: false,
    state,
    terminal: 'none',
  };
}

/**
 * Records the user's answer to the current question, then pumps the
 * reevaluation pipeline until the next question is ready (or the interview
 * settles).
 */
export async function submitAnswer(
  userId: string,
  ideaId: string,
  input: AnswerInterviewInput,
  locale: string
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const { id: interviewId, version, state } = await loadInterview(userId, ideaId);

  if (state.phase !== 'ASK' && state.phase !== 'SYNTHESIZE') {
    throw new ConflictError(
      state.phase === 'READY' || state.phase === 'DONE'
        ? 'Interview already complete.'
        : `Cannot answer in phase ${state.phase}.`
    );
  }
  if (!state.current) {
    throw new ConflictError('No question is currently being asked.');
  }
  if (state.current.point.id !== input.pointId) {
    throw new ConflictError('Answer does not match the current question.');
  }

  // `pointId` is checked above, but `optionId` was not: a client could replay an
  // option that was never offered and have it persisted as if the model had
  // proposed it.
  if (input.optionId !== undefined) {
    const offered = state.current.options.some((o) => o.id === input.optionId);
    if (!offered) {
      throw new ValidationError(
        { optionId: ['Not one of the options offered for this question.'] },
        'Answer does not match the current question.'
      );
    }
  }

  const answer: Answer = {
    pointId: input.pointId,
    optionId: input.optionId,
    value: input.value,
    freeText: input.freeText ?? null,
  };

  const agent = createAgent(locale);
  let result: Awaited<ReturnType<typeof pump>>;
  try {
    result = await pump(agent, state, [{ type: 'ANSWERED', answer }], userId);
  } catch (err) {
    // The model call failed, but the user's answer is valid and they should not
    // have to retype it. Record it before surfacing the transport failure so a
    // retry resumes rather than restarts.
    await persistAnswerOnly(interviewId, userId, state, answer).catch(() => {});
    throw toRetryableModelError(err);
  }

  const interview = await persist(interviewId, userId, result.state, version);

  return {
    interviewId: interview.id,
    created: false,
    state: result.state,
    terminal: result.terminal,
  };
}

export async function skipQuestion(
  userId: string,
  ideaId: string,
  locale: string
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const { id: interviewId, version, state } = await loadInterview(userId, ideaId);

  if ((state.phase !== 'ASK' && state.phase !== 'SYNTHESIZE') || !state.current) {
    throw new ConflictError('No question to skip.');
  }

  const agent = createAgent(locale);
  const result = await pump(
    agent,
    state,
    [{ type: 'SKIPPED', pointId: state.current.point.id }],
    userId
  );
  const interview = await persist(interviewId, userId, result.state, version);

  return {
    interviewId: interview.id,
    created: false,
    state: result.state,
    terminal: result.terminal,
  };
}

export async function deferQuestion(
  userId: string,
  ideaId: string,
  pointId: string,
  reason: string | undefined,
  locale: string
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const { id: interviewId, version, state } = await loadInterview(userId, ideaId);

  if (state.phase !== 'ASK' || !state.current) {
    throw new ConflictError('No question to defer.');
  }
  if (state.current.point.id !== pointId) {
    throw new ConflictError('Defer does not match the current question.');
  }

  const agent = createAgent(locale);
  const result = await pump(agent, state, [{ type: 'DEFERRED', pointId, reason }], userId);
  const interview = await persist(interviewId, userId, result.state, version);

  const point = result.state.decisions[pointId];
  if (point?.deferred) {
    const title = state.open.find((p) => p.id === pointId)?.title ?? pointId;
    await recordDeferral(ideaId, userId, title, reason);
  }

  return {
    interviewId: interview.id,
    created: false,
    state: result.state,
    terminal: result.terminal,
  };
}

/**
 * Records a deferral in the idea's `## Assumptions` list in `overview.md`.
 *
 * Deferring is a real planning outcome, not a dismissal: the assumption travels
 * with the idea. Other hand-edited content in the file is preserved.
 */
async function recordDeferral(
  ideaId: string,
  userId: string,
  pointTitle: string,
  reason: string | undefined
): Promise<void> {
  const existing = await storage.readIdeaSection(userId, ideaId, 'overview.md');
  const next = appendAssumption(existing, pointTitle, reason);
  await storage.writeIdeaSection(userId, ideaId, 'overview.md', next);
}

/**
 * Records an answer that the model failed to process.
 *
 * The point stays open and the phase stays `ASK`, so the user can retry. The
 * decision entry is what makes the answer recoverable; without it a provider
 * timeout silently discarded everything the user typed.
 */
async function persistAnswerOnly(
  interviewId: string,
  userId: string,
  state: InterviewState,
  answer: Answer
): Promise<void> {
  const point = state.open.find((p) => p.id === answer.pointId);
  if (!point) return;

  const pending = {
    pointId: answer.pointId,
    optionId: answer.optionId ?? '',
    value: answer.value,
    openedPointIds: [],
    closedPointIds: [],
    deferred: false,
    blocks: point.blocks,
    at: new Date().toISOString(),
  };

  await prisma.interview.updateMany({
    where: { id: interviewId, userId },
    data: {
      state: {
        ...state,
        decisions: { ...state.decisions, [answer.pointId]: pending },
      } as unknown as JsonState,
      version: { increment: 1 },
    },
  });
}

/**
 * Turns a provider failure into a status the client can act on.
 *
 * A timeout or a dropped connection leaves the interview exactly as it was, so
 * the request is safe to repeat; `AppError`s from validation and the budget are
 * already meaningful and pass through untouched.
 */
function toRetryableModelError(err: unknown): unknown {
  if (err instanceof AppError) return err;

  const message = err instanceof Error ? err.message : String(err);
  const retryable =
    err instanceof LlmTimeoutError ||
    /abort|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed|network/i.test(
      message
    );

  return retryable
    ? new AppError('The AI provider is unavailable. Please try again.', 503, 'LLM_UNAVAILABLE')
    : err;
}

/**
 * Manual "I'm stuck" override: asks the model for a verdict on one open point
 * without waiting for the skip counter to trip.
 */
export async function synthesizeInterview(
  userId: string,
  ideaId: string,
  input: SynthesisRequestInput,
  locale: string
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const { id: interviewId, version, state } = await loadInterview(userId, ideaId);

  if (state.phase === 'READY' || state.phase === 'DONE') {
    throw new ConflictError('Interview already complete.');
  }
  if (!state.open.some((p) => p.id === input.pointId)) {
    throw new NotFoundError('Decision point is not open.');
  }

  const agent = createAgent(locale);
  // Charged here because this path bypasses the loop's directive handling; the
  // loop charges its own `synthesize` directives so skip-driven synthesis is
  // not free.
  chargeSynthesis(userId);
  const event = await agent.resolve(state, {
    type: 'synthesize',
    pointId: input.pointId,
  });
  if (!event) throw new Error('Synthesis could not be produced.');

  // No `budgetOwner`: the charge above already covers this call, and the
  // loop is only replaying the resulting event.
  const { state: next, terminal } = await runLoop(agent, state, [event]);
  const interview = await persist(interviewId, userId, next, version);

  return { interviewId: interview.id, created: false, state: next, terminal };
}

async function persist(
  interviewId: string,
  userId: string,
  state: InterviewState,
  expectedVersion: number
): Promise<{ id: string }> {
  // Conditional on the version the caller read. Two concurrent answers both pay
  // for a model call; without this the second would silently overwrite the
  // first, losing its answer and leaving the client showing a state that never
  // happened.
  const result = await prisma.interview.updateMany({
    where: { id: interviewId, userId, version: expectedVersion },
    data: {
      phase: state.phase,
      state: state as unknown as JsonState,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    throw new ConflictError(
      'This interview changed while your answer was being processed. Reload and try again.'
    );
  }

  return { id: interviewId };
}
