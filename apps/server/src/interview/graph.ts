import { createHash } from "node:crypto";

import { questionSchema } from "@repo/shared";
import type { DecisionPoint, Question } from "@repo/shared";

import type { LlmClient } from "../services/llm.service";
import type { Answer, InterviewDirective, InterviewEvent } from "./reducer";
import type { InterviewState } from "./state";
import {
  buildClassifyMessages,
  classifyOutputSchema,
  normalizeClassifyOutput,
} from "./prompts/classify";
import {
  buildQuestionMessages,
  normalizeQuestionOutput,
} from "./prompts/question";
import {
  buildReevaluateMessages,
  normalizeReevaluateOutput,
  reevaluateOutputSchema,
} from "./prompts/reevaluate";

/**
 * Resolves reducer directives into the model results the reducer consumes.
 *
 * This file is the ONLY place interview LLM calls are made; the reducer stays
 * pure and testable. Each resolver is a thin layer: build prompt -> structured
 * LLM call -> validate/normalize -> event.
 */
export class InterviewAgent {
  constructor(
    private readonly llm: LlmClient,
    private readonly locale: string,
  ) {}

  static pointId(label: string, projectType: string): string {
    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);
    const hash = createHash("sha1")
      .update(`${projectType}:${label}`)
      .digest("hex")
      .slice(0, 4);
    return `${slug || "point"}-${hash}`;
  }

  /**
   * Resolves a directive to the next event. Returns null for directives that
   * need no model call (synthesis is Phase 3) or cannot be satisfied.
   */
  async resolve(
    state: InterviewState,
    directive: InterviewDirective,
  ): Promise<InterviewEvent | null> {
    switch (directive.type) {
      case "classify":
        return this.classify(state);
      case "ask":
        return this.ask(state, directive);
      case "reevaluate":
        return this.reevaluate(state, directive);
      case "synthesize":
      case "complete":
        return null;
      default:
        return null;
    }
  }

  private async classify(state: InterviewState): Promise<InterviewEvent> {
    const out = await this.llm.completeStructured(
      classifyOutputSchema,
      buildClassifyMessages(state, this.locale),
      { temperature: 0.2, maxTokens: 1400 },
    );

    const normalized = normalizeClassifyOutput(out);
    const open: DecisionPoint[] = normalized.open.map((p) => ({
      ...p,
      id: InterviewAgent.pointId(p.id, state.idea.projectType),
      status: "open" as const,
    }));

    return { type: "CLASSIFIED", domain: normalized.domain, open };
  }

  private async ask(
    state: InterviewState,
    directive: Extract<InterviewDirective, { type: "ask" }>,
  ): Promise<InterviewEvent | null> {
    const point = state.open.find((p) => p.id === directive.pointId);
    if (!point) return null;

    const q = await this.llm.completeStructured<Question>(
      questionSchema,
      buildQuestionMessages(state, point, this.locale),
      { temperature: 0.6, maxTokens: 800 },
    );

    const question = normalizeQuestionOutput(point, q);
    return { type: "QUESTION_RENDERED", question };
  }

  private async reevaluate(
    state: InterviewState,
    directive: Extract<InterviewDirective, { type: "reevaluate" }>,
  ): Promise<InterviewEvent> {
    const out = await this.llm.completeStructured(
      reevaluateOutputSchema,
      buildReevaluateMessages(state, directive.answer, this.locale),
      { temperature: 0.4, maxTokens: 900 },
    );

    const normalized = normalizeReevaluateOutput(out, directive.answer);
    const opened: DecisionPoint[] = normalized.opened.map((p) => ({
      ...p,
      id: InterviewAgent.pointId(p.id, state.idea.projectType),
      status: "open" as const,
    }));

    return {
      type: "REEVALUATED",
      answer: directive.answer,
      opened,
      closed: normalized.closed,
      invalidated: normalized.invalidated,
    };
  }
}

export type { Answer };