import { PLANNING_SECTION_NAMES } from "@repo/shared";
import type { DecisionPoint, Question } from "@repo/shared";

import { sectionsForType } from "../lib/planningTemplates";
import { assertValidFrontier } from "./validate";
import {
  MAX_TURNS,
  STUCK_ATTEMPTS,
  type InterviewDecision,
  type InterviewPhase,
  type InterviewState,
} from "./state";

export type Answer
  = { pointId: string; optionId: string; value: string; freeText: string | null };

export type InterviewEvent =
  | { type: "START" }
  | { type: "CLASSIFIED"; domain: NonNullable<InterviewState["domain"]>; open: DecisionPoint[] }
  | { type: "QUESTION_RENDERED"; question: Question }
  | { type: "ANSWERED"; answer: Answer }
  | { type: "REEVALUATED"; opened: DecisionPoint[]; closed: string[]; invalidated: string[]; answer: Answer }
  | { type: "SKIPPED"; pointId: string }
  | { type: "DEFERRED"; pointId: string; reason?: string };

export type InterviewDirective =
  | { type: "classify" }
  | { type: "ask"; pointId: string }
  | { type: "reevaluate"; answer: Answer }
  | { type: "synthesize"; pointId: string }
  | { type: "complete"; reason: "ready" | "turn-cap" };

export interface ReduceResult {
  state: InterviewState;
  directives: InterviewDirective[];
}

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

/**
 * Pure state transition. No I/O anywhere in this file.
 *
 * `advance(state, event) -> { state, directives }`. Model results arrive as
 * events; the caller (the graph) resolves directives with LLM calls and feeds
 * the results back as events.
 */
export function advance(
  state: InterviewState,
  event: InterviewEvent,
): ReduceResult {
  switch (event.type) {
    case "START":
      return onStart(state);
    case "CLASSIFIED":
      return onClassified(state, event);
    case "QUESTION_RENDERED":
      return onQuestionRendered(state, event);
    case "ANSWERED":
      return onAnswered(state, event);
    case "REEVALUATED":
      return onReevaluated(state, event);
    case "SKIPPED":
      return onSkipped(state, event);
    case "DEFERRED":
      return onDeferred(state, event);
    default:
      return { state, directives: [] };
  }
}

function onStart(state: InterviewState): ReduceResult {
  if (state.phase !== "CLASSIFY") {
    return { state, directives: [] };
  }
  return { state, directives: [{ type: "classify" }] };
}

function onClassified(
  state: InterviewState,
  event: Extract<InterviewEvent, { type: "CLASSIFIED" }>,
): ReduceResult {
  assertValidFrontier(event.open);

  const next = {
    ...state,
    phase: "ASK" as InterviewPhase,
    domain: event.domain,
    open: event.open.map((p) => ({ ...p, status: "open" as const })),
    coverage: computeCoverage(
      event.open.map((p) => ({ ...p, status: "open" as const })),
    ),
  };

  const selected = selectPoint(next);
  if (!selected) {
    return {
      state: { ...next, phase: "READY", current: null },
      directives: [{ type: "complete", reason: "ready" }],
    };
  }

  return { state: next, directives: [{ type: "ask", pointId: selected.id }] };
}

function onQuestionRendered(
  state: InterviewState,
  event: Extract<InterviewEvent, { type: "QUESTION_RENDERED" }>,
): ReduceResult {
  const asked = state.asked.includes(event.question.point.id)
    ? state.asked
    : [...state.asked, event.question.point.id];

  return {
    state: { ...state, asked, current: event.question },
    directives: [],
  };
}

function onAnswered(
  state: InterviewState,
  event: Extract<InterviewEvent, { type: "ANSWERED" }>,
): ReduceResult {
  if (state.phase !== "ASK") {
    return { state, directives: [] };
  }
  return {
    state,
    directives: [{ type: "reevaluate", answer: event.answer }],
  };
}

function onReevaluated(
  state: InterviewState,
  event: Extract<InterviewEvent, { type: "REEVALUATED" }>,
): ReduceResult {
  const { answer, opened, closed, invalidated } = event;

  const answeredPoint = state.open.find((p) => p.id === answer.pointId);
  if (!answeredPoint) {
    return { state, directives: [] };
  }

  assertValidFrontier(opened);

  const decidedPointIds = new Set([
    answer.pointId,
    ...closed,
    ...invalidated,
  ]);
  const kept = state.open.filter((p) => !decidedPointIds.has(p.id));
  const keptIds = new Set(kept.map((p) => p.id));
  const openedClean = opened
    .filter((p) => p.id !== answer.pointId && !keptIds.has(p.id))
    .map((p) => ({ ...p, status: "open" as const }));

  const decision: InterviewDecision = {
    pointId: answer.pointId,
    optionId: answer.optionId,
    value: answer.value,
    openedPointIds: openedClean.map((p) => p.id),
    closedPointIds: [...closed, ...invalidated],
    deferred: false,
    blocks: answeredPoint.blocks,
    at: new Date().toISOString(),
  };

  const turn = state.turn + 1;
  const next: InterviewState = {
    ...state,
    decisions: { ...state.decisions, [answer.pointId]: decision },
    open: [...kept, ...openedClean],
    current: null,
    stuck: state.stuck?.pointId === answer.pointId ? null : state.stuck,
    turn,
    coverage: computeCoverage([...kept, ...openedClean]),
  };

  return afterResolution(next);
}

function onSkipped(
  state: InterviewState,
  event: Extract<InterviewEvent, { type: "SKIPPED" }>,
): ReduceResult {
  const attempts =
    state.stuck?.pointId === event.pointId ? state.stuck.attempts + 1 : 1;

  if (attempts >= STUCK_ATTEMPTS) {
    return {
      state: {
        ...state,
        phase: "SYNTHESIZE",
        asked: state.asked.includes(event.pointId)
          ? state.asked
          : [...state.asked, event.pointId],
        stuck: { pointId: event.pointId, attempts },
      },
      directives: [{ type: "synthesize", pointId: event.pointId }],
    };
  }

  const asked = state.asked.includes(event.pointId)
    ? state.asked
    : [...state.asked, event.pointId];

  const selected = selectPoint({ open: state.open, asked });

  if (!selected) {
    return {
      state: {
        ...state,
        stuck: { pointId: event.pointId, attempts },
        phase: "SYNTHESIZE",
      },
      directives: [{ type: "synthesize", pointId: event.pointId }],
    };
  }

  return {
    state: {
      ...state,
      asked: state.asked.includes(event.pointId)
        ? state.asked
        : [...state.asked, event.pointId],
      stuck: { pointId: event.pointId, attempts },
    },
    directives: [{ type: "ask", pointId: selected.id }],
  };
}

function onDeferred(
  state: InterviewState,
  event: Extract<InterviewEvent, { type: "DEFERRED" }>,
): ReduceResult {
  if (event.pointId === undefined) return { state, directives: [] };

  const point = state.open.find((p) => p.id === event.pointId);
  if (!point) return { state, directives: [] };

  const decision: InterviewDecision = {
    pointId: point.id,
    optionId: "deferred",
    value: `deferred: ${event.reason ?? "no reason given"}`,
    openedPointIds: [],
    closedPointIds: [point.id],
    deferred: true,
    blocks: point.blocks,
    at: new Date().toISOString(),
  };

  const kept = state.open.filter((p) => p.id !== point.id);
  const next: InterviewState = {
    ...state,
    decisions: { ...state.decisions, [point.id]: decision },
    open: kept,
    current: null,
    stuck: state.stuck?.pointId === point.id ? null : state.stuck,
    coverage: computeCoverage(kept),
  };

  return afterResolution(next);
}

function afterResolution(state: InterviewState): ReduceResult {
  if (state.turn >= MAX_TURNS) {
    return {
      state: { ...state, phase: "DONE", current: null },
      directives: [{ type: "complete", reason: "turn-cap" }],
    };
  }

  if (isReady(state)) {
    return {
      state: { ...state, phase: "READY", current: null },
      directives: [{ type: "complete", reason: "ready" }],
    };
  }

  const selected = selectPoint(state);
  if (!selected) {
    return {
      state: { ...state, phase: "READY", current: null },
      directives: [{ type: "complete", reason: "ready" }],
    };
  }

  return { state, directives: [{ type: "ask", pointId: selected.id }] };
}

/** Highest-priority unresolved point that has not been asked. Pure. */
export function selectPoint(state: Pick<InterviewState, "open" | "asked">): DecisionPoint | null {
  const candidates = state.open
    .filter((p) => !state.asked.includes(p.id))
    .sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
    );

  return candidates[0] ?? null;
}

function isReady(state: InterviewState): boolean {
  const openP0 = state.open.some((p) => p.priority === "P0");
  if (openP0) return false;

  return state.coverage && isCoverageMet(state);
}

function isCoverageMet(state: InterviewState): boolean {
  const required = sectionsForType(state.idea.projectType).created;
  return required.every((section) => state.coverage[section] >= 1);
}

/**
 * Recomputes grounded-ness per section.
 *
 * A section counts as grounded (1) once no decision point that blocks it
 * remains on the open frontier. `coverage` only rises as the interview
 * resolves the questions that actually matter for it, and it is derived from
 * the canonical section list so there is no second copy to drift.
 */
export function computeCoverage(
  open: DecisionPoint[],
): InterviewState["coverage"] {
  const coverage = {} as InterviewState["coverage"];
  for (const section of PLANNING_SECTION_NAMES) {
    const blockers = open.filter((p) => p.blocks.includes(section)).length;
    coverage[section] = blockers > 0 ? 0 : 1;
  }
  return coverage;
}