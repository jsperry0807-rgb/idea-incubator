import type { Prisma } from "../generated/prisma/client";
import prisma from "../lib/prisma";
import { ConflictError, NotFoundError } from "../lib/errors";
import { assertIdeaOwnership } from "./idea.service";
import { llm } from "./llm.service";
import { InterviewAgent } from "../interview/graph";
import {
  advance,
  type Answer,
  type InterviewEvent,
} from "../interview/reducer";
import { emptyCoverage, type InterviewState } from "../interview/state";
import type { AnswerInterviewInput } from "@repo/shared";

const MAX_PUMP_STEPS = 100;

type JsonState = Prisma.InputJsonValue;

export interface InterviewResult {
  interviewId: string;
  created: boolean;
  state: InterviewState;
  terminal: "none" | "ready" | "turn-cap" | "needs-synthesis";
}

function createInitialState(
  ideaId: string,
  title: string | null,
  description: string | null,
  projectType: Awaited<ReturnType<typeof assertIdeaOwnership>>,
): InterviewState {
  return {
    idea: {
      id: ideaId,
      title: title ?? "Untitled idea",
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
    phase: "CLASSIFY",
    turn: 0,
  };
}

async function loadInterview(userId: string, ideaId: string) {
  const interview = await prisma.interview.findFirst({
    where: { ideaId, userId },
  });

  if (!interview) {
    throw new NotFoundError("Interview not found. Start it with POST /interview.");
  }

  return interview.state as unknown as InterviewState;
}

/**
 * Runs the reducer until it settles (no more directives needing a model call)
 * and returns the final state. Terminal directives (synthesize, complete) stop
 * the loop and are surfaced via `terminal`.
 */
async function pump(
  agent: InterviewAgent,
  state: InterviewState,
  initialEvents: InterviewEvent[],
): Promise<{ state: InterviewState; terminal: InterviewResult["terminal"] }> {
  let s = state;
  const queue: InterviewEvent[] = [...initialEvents];
  let steps = 0;
  let terminal: InterviewResult["terminal"] = "none";

  while (queue.length > 0 && steps < MAX_PUMP_STEPS) {
    const event = queue.shift()!;
    const result = advance(s, event);
    s = result.state;

    for (const directive of result.directives) {
      if (directive.type === "complete") {
        terminal = directive.reason === "turn-cap" ? "turn-cap" : "ready";
        continue;
      }
      if (directive.type === "synthesize") {
        terminal = "needs-synthesis";
        continue;
      }

      const resolved = await agent.resolve(s, directive);
      if (resolved) {
        queue.push(resolved);
      }
    }
    steps++;
  }

  return { state: s, terminal };
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
  locale: string,
): Promise<InterviewResult> {
  const projectType = await assertIdeaOwnership(userId, ideaId);

  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, userId },
    select: { id: true, title: true, description: true, projectType: true },
  });
  if (!idea) throw new NotFoundError("Idea not found");

  const existing = await prisma.interview.findFirst({
    where: { ideaId, userId },
  });

  if (existing) {
    const state = existing.state as unknown as InterviewState;
    // Crash-safe resume: finish a START that never classified.
    if (state.phase === "CLASSIFY" && state.turn === 0 && state.open.length === 0) {
      const agent = new InterviewAgent(llm, locale);
      const result = await pump(agent, state, [{ type: "START" }]);
      const interview = await persist(ideaId, userId, result.state);
      return {
        interviewId: interview.id,
        created: false,
        state: result.state,
        terminal: result.terminal,
      };
    }
    return { interviewId: existing.id, created: false, state, terminal: "none" };
  }

  const initialState = createInitialState(
    idea.id,
    idea.title,
    idea.description,
    projectType,
  );

  const agent = new InterviewAgent(llm, locale);
  const result = await pump(agent, initialState, [{ type: "START" }]);

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

export async function getInterviewState(
  userId: string,
  ideaId: string,
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const interview = await prisma.interview.findFirst({
    where: { ideaId, userId },
  });
  if (!interview) {
    throw new NotFoundError("Interview not found. Start it with POST /interview.");
  }
  const state = interview.state as unknown as InterviewState;
  return {
    interviewId: interview.id,
    created: false,
    state,
    terminal: "none",
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
  locale: string,
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const state = await loadInterview(userId, ideaId);

  if (state.phase !== "ASK") {
    throw new ConflictError(
      state.phase === "READY" || state.phase === "DONE"
        ? "Interview already complete."
        : `Cannot answer in phase ${state.phase}.`,
    );
  }
  if (!state.current) {
    throw new ConflictError("No question is currently being asked.");
  }
  if (state.current.point.id !== input.pointId) {
    throw new ConflictError("Answer does not match the current question.");
  }

  const answer: Answer = {
    pointId: input.pointId,
    optionId: input.optionId,
    value: input.value,
    freeText: input.freeText ?? null,
  };

  const agent = new InterviewAgent(llm, locale);
  const result = await pump(agent, state, [{ type: "ANSWERED", answer }]);
  const interview = await persist(ideaId, userId, result.state);

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
  locale: string,
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const state = await loadInterview(userId, ideaId);

  if (state.phase !== "ASK" || !state.current) {
    throw new ConflictError("No question to skip.");
  }

  const agent = new InterviewAgent(llm, locale);
  const result = await pump(agent, state, [
    { type: "SKIPPED", pointId: state.current.point.id },
  ]);
  const interview = await persist(ideaId, userId, result.state);

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
  locale: string,
): Promise<InterviewResult> {
  await assertIdeaOwnership(userId, ideaId);
  const state = await loadInterview(userId, ideaId);

  if (state.phase !== "ASK" || !state.current) {
    throw new ConflictError("No question to defer.");
  }
  if (state.current.point.id !== pointId) {
    throw new ConflictError("Defer does not match the current question.");
  }

  const agent = new InterviewAgent(llm, locale);
  const result = await pump(agent, state, [
    { type: "DEFERRED", pointId, reason },
  ]);
  const interview = await persist(ideaId, userId, result.state);

  return {
    interviewId: interview.id,
    created: false,
    state: result.state,
    terminal: result.terminal,
  };
}

async function persist(
  ideaId: string,
  userId: string,
  state: InterviewState,
): Promise<{ id: string }> {
  const interview = await prisma.interview.findFirst({
    where: { ideaId, userId },
  });
  if (!interview) throw new NotFoundError("Interview not found.");

  await prisma.interview.update({
    where: { id: interview.id },
    data: { phase: state.phase, state: state as unknown as JsonState },
  });

  return { id: interview.id };
}