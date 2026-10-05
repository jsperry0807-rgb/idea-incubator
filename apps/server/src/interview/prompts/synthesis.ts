import type { z } from 'zod';

import { synthesisSchema } from '@repo/shared';
import type { InterviewState } from '../state';
import type { LlmMessage } from '../../services/llm.service';
import {
  fence,
  fenceOrNone,
  formatDecisionLog,
  stripControlChars,
  withUntrustedDataRule,
} from './untrusted';

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
  locale: string
): LlmMessage[] {
  const point = state.open.find((p) => p.id === forPointId);
  const question = state.current?.point.id === forPointId ? state.current : null;

  return [
    {
      role: 'system',
      content: withUntrustedDataRule([
        'You give a decisive 3-part verdict on one stuck decision point of a product planning interview.',
        'Return JSON only:',
        '- recommendation: the single best choice to make now, with a brief why.',
        '- keyTradeoffs: 2-4 concrete tradeoffs the user should accept when picking it.',
        '- strongestDisagreement: what a smart person would argue against your recommendation.',
        'Rules:',
        '- Be concrete and project-specific. Never hedge with "it depends".',
        "- All fields must be prose in the user's language.",
        `Respond in ${locale}.`,
      ]),
    },
    {
      role: 'user',
      content: [
        `Project type: ${stripControlChars(state.idea.projectType)}`,
        `Idea: ${fence('UNTRUSTED_IDEA_TITLE', state.idea.title, 200)}`,
        `Description: ${fenceOrNone('UNTRUSTED_IDEA_DESCRIPTION', state.idea.description)}`,
        `Domain: ${state.domain?.primary ?? 'unknown'}`,
        `This point has been asked twice without a confident answer:`,
        point
          ? `  - [${stripControlChars(point.priority)}] ${stripControlChars(
              point.id
            )}: ${fence('UNTRUSTED_POINT_TITLE', point.title, 200)}\n    Why: ${fence(
              'UNTRUSTED_POINT_WHY',
              point.why,
              300
            )}`
          : `  - ${stripControlChars(forPointId)}`,
        question
          ? `Question asked: ${fence('UNTRUSTED_QUESTION_PROMPT', question.prompt, 300)}\nOptions:\n${question.options
              .map(
                (o) =>
                  `  - ${stripControlChars(o.id)}: ${fence('UNTRUSTED_OPTION_LABEL', o.label, 200)}`
              )
              .join('\n')}`
          : 'No current question recorded.',
        `Decisions so far:`,
        formatDecisionLog(Object.values(state.decisions)),
        '',
        'Give the user a clear recommendation so the interview can move on.',
      ].join('\n'),
    },
  ];
}

/** Pins the verdict to the point that triggered it. */
export function normalizeSynthesisOutput(
  out: SynthesisOutput,
  forPointId: string
): SynthesisOutput {
  return { ...out, forPointId };
}
