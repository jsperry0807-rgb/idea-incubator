import type { z } from "zod";

import { synthesisSchema } from "@repo/shared";
import type { InterviewState } from "../state";
import type { LlmMessage } from "../../services/llm.service";

export const synthesisOutputSchema = synthesisSchema;

export type SynthesisOutput = z.infer<typeof synthesisOutputSchema>;

/**
 * Builds messages that produce the 3-bullet verdict for a stuck point:
 * a recommendation, the key tradeoffs, and the strongest disagreement with
 * that recommendation.
 */
export function buildSynthesisMessages(
  state: InterviewState,
  forPointId: string,
  locale: string,
): LlmMessage[] {
  const point = state.open.find((p) => p.id === forPointId);
  const question = state.current?.point.id === forPointId ? state.current : null;

  return [
    {
      role: "system",
      content: [
        "You give a decisive 3-part verdict on one stuck decision point of a product planning interview.",
        "Return JSON only:",
        "- recommendation: the single best choice to make now, with a brief why.",
        "- keyTradeoffs: 2-4 concrete tradeoffs the user should accept when picking it.",
        "- strongestDisagreement: what a smart person would argue against your recommendation.",
        "Rules:",
        "- Be concrete and project-specific. Never hedge with \"it depends\".",
        "- All fields must be prose in the user's language.",
        `Respond in ${locale}.`,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `Project type: ${state.idea.projectType}`,
        `Idea: ${state.idea.title}`,
        state.idea.description
          ? `Description: ${state.idea.description}`
          : "Description: (none)",
        `Domain: ${state.domain?.primary ?? "unknown"}`,
        `This point has been asked twice without a confident answer:`,
        point
          ? `  - [${point.priority}] ${point.id}: ${point.title}\n    Why: ${point.why}`
          : `  - ${forPointId}`,
        question
          ? `Question asked: "${question.prompt}"\nOptions:\n${question.options
              .map((o) => `  - ${o.id}: ${o.label}`)
              .join("\n")}`
          : "No current question recorded.",
        `Decisions so far:`,
        Object.values(state.decisions).length === 0
          ? "  (none)"
          : Object.values(state.decisions)
              .map((d) => `  - ${d.pointId}: "${d.optionId}" ${d.value.slice(0, 120)}`)
              .join("\n"),
        "",
        "Give the user a clear recommendation so the interview can move on.",
      ].join("\n"),
    },
  ];
}

/** Pins the verdict to the point that triggered it. */
export function normalizeSynthesisOutput(
  out: SynthesisOutput,
  forPointId: string,
): SynthesisOutput {
  return { ...out, forPointId };
}