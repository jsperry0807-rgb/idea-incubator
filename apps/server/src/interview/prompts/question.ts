import { z } from "zod";

import { questionSchema } from "@repo/shared";
import type { DecisionPoint } from "@repo/shared";
import type { InterviewState } from "../state";
import type { LlmMessage } from "../../services/llm.service";
import { assertValidQuestion } from "../validate";

export const questionOutputSchema = questionSchema;
export type QuestionOutput = z.infer<typeof questionOutputSchema>;

/** Builds messages that render a decision point into a concrete question. */
export function buildQuestionMessages(
  state: InterviewState,
  point: DecisionPoint,
  locale: string,
): LlmMessage[] {
  const decisions =
    Object.values(state.decisions).length === 0
      ? "(none yet)"
      : Object.values(state.decisions)
          .map(
            (d) =>
              `- ${d.pointId}: chose "${d.optionId}" (${d.value})${
                d.deferred ? " [deferred]" : ""
              }`,
          )
          .join("\n");

  return [
    {
      role: "system",
      content: [
        "You interview founders on a specific decision point for their product idea.",
        "Rules:",
        "- Ask ONE question about the current decision point only.",
        "- Options: 2-4 distinct, plausible answers. Short labels, full effect described in `effect`.",
        "- At least one option must clearly eliminate at least one implementation path (the eliminated paths already listed on the point).",
        "- Correct any of the point's eliminated paths if the interview context shows they no longer apply (return the corrected list in the question).",
        "- Never re-ask resolved decisions; you are given the full decision log.",
        "- Prefer plain language a first-time founder can answer in 30 seconds.",
        `Respond in ${locale}.`,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `Project type: ${state.idea.projectType}`,
        `Title: ${state.idea.title}`,
        state.idea.description
          ? `Description: ${state.idea.description}`
          : "Description: (none)",
        `Domain: ${state.domain?.primary ?? "unknown"} (confidence ${
          state.domain?.confidence?.toFixed(2) ?? "n/a"
        })`,
        `Decision log:\n${decisions}`,
        `Decision point P0/P1 frontier (currently open):`,
        state.open.map((p) => `  - [${p.priority}] ${p.id}: ${p.title}`).join("\n"),
        `Ask about this point:`,
        `  [${point.priority}] ${point.id}: ${point.title}${point.why ? ` — ${point.why}` : ""}`,
        point.eliminatesPaths.length > 0
          ? `  Eliminated paths on this point: ${point.eliminatesPaths.join(", ")}`
          : "  Eliminates paths: (none provided)",
      ].join("\n"),
    },
  ];
}

/**
 * Normalizes and validates a rendered question against its point.
 * Throws if the model produced an impossible question.
 */
export function normalizeQuestionOutput(point: DecisionPoint, q: QuestionOutput) {
  const normalized = {
    ...q,
    point: { ...q.point, id: point.id, status: point.status },
  };
  assertValidQuestion(point, normalized);
  return normalized;
}