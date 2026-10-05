import type { z } from 'zod';

import { questionSchema } from '@repo/shared';
import type { DecisionPoint } from '@repo/shared';
import type { InterviewState } from '../state';
import type { LlmMessage } from '../../services/llm.service';
import { assertValidQuestion } from '../validate';
import {
  fence,
  fenceOrNone,
  formatDecisionLog,
  stripControlChars,
  withUntrustedDataRule,
} from './untrusted';

export const questionOutputSchema = questionSchema;
export type QuestionOutput = z.infer<typeof questionOutputSchema>;

/** Builds messages that render a decision point into a concrete question. */
export function buildQuestionMessages(
  state: InterviewState,
  point: DecisionPoint,
  locale: string
): LlmMessage[] {
  const decisions = formatDecisionLog(Object.values(state.decisions));

  return [
    {
      role: 'system',
      content: withUntrustedDataRule([
        'You interview founders on a specific decision point for their product idea.',
        'Rules:',
        '- Ask ONE question about the current decision point only.',
        '- Options: 2-4 distinct, plausible answers. Short labels, full effect described in `effect`.',
        '- At least one option must clearly eliminate at least one implementation path (the eliminated paths already listed on the point).',
        "- Correct any of the point's eliminated paths if the interview context shows they no longer apply (return the corrected list in the question).",
        '- Never re-ask resolved decisions; you are given the full decision log.',
        '- Prefer plain language a first-time founder can answer in 30 seconds.',
        `Respond in ${locale}.`,
      ]),
    },
    {
      role: 'user',
      content: [
        `Project type: ${stripControlChars(state.idea.projectType)}`,
        `Title: ${fence('UNTRUSTED_IDEA_TITLE', state.idea.title, 200)}`,
        `Description: ${fenceOrNone('UNTRUSTED_IDEA_DESCRIPTION', state.idea.description)}`,
        `Domain: ${state.domain?.primary ?? 'unknown'} (confidence ${
          state.domain?.confidence?.toFixed(2) ?? 'n/a'
        })`,
        `Decision log:\n${decisions}`,
        `Decision point P0/P1 frontier (currently open):`,
        state.open
          .map(
            (p) =>
              `  - [${stripControlChars(p.priority)}] ${stripControlChars(p.id)}: ${fence(
                'UNTRUSTED_POINT_TITLE',
                p.title,
                200
              )}`
          )
          .join('\n'),
        `Ask about this point:`,
        `  [${stripControlChars(point.priority)}] ${stripControlChars(point.id)}: ${fence(
          'UNTRUSTED_POINT_TITLE',
          point.title,
          200
        )}`,
        point.why ? `  Why it matters: ${fence('UNTRUSTED_POINT_WHY', point.why, 300)}` : '',
        point.eliminatesPaths.length > 0
          ? `  Eliminated paths on this point: ${point.eliminatesPaths
              .map((path) => stripControlChars(path))
              .join(', ')}`
          : '  Eliminates paths: (none provided)',
      ]
        .filter(Boolean)
        .join('\n'),
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
