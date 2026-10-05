import { z } from 'zod';

import { decisionPointSchema } from '@repo/shared';
import type { InterviewState } from '../state';
import type { LlmMessage } from '../../services/llm.service';
import { fence, fenceOrNone, stripControlChars, withUntrustedDataRule } from './untrusted';

export const classifyOutputSchema = z.object({
  domain: z.object({
    primary: z.string().min(1),
    confidence: z.number().min(0).max(1),
    signals: z.array(z.string().min(1)).min(1),
  }),
  open: z.array(decisionPointSchema).min(1),
});

export type ClassifyOutput = z.infer<typeof classifyOutputSchema>;

/** Builds the one-shot classification prompt. Runs once, cached afterward. */
export function buildClassifyMessages(state: InterviewState, locale: string): LlmMessage[] {
  return [
    {
      role: 'system',
      content: withUntrustedDataRule([
        'You classify new product ideas for a planning assistant.',
        'Identify the domain and the architectural decisions that genuinely block a plan for this idea.',
        'Rules:',
        '- domain.primary: concise domain label (e.g. incremental-game, b2b-saas, physical-goods).',
        '- domain.confidence: 0..1 confidence in the classification.',
        "- domain.signals: 1-4 short phrases quoted from the user's own words.",
        '- open: the initial P0/P1 frontier. Each point must eliminate at least one implementation path (eliminatesPaths non-empty).',
        '- Do NOT return template questions. Points must be specific to this idea.',
        `Respond in ${locale}.`,
      ]),
    },
    {
      role: 'user',
      content: [
        `Project type: ${stripControlChars(state.idea.projectType)}`,
        `Title: ${fence('UNTRUSTED_IDEA_TITLE', state.idea.title, 200)}`,
        `Description: ${fenceOrNone('UNTRUSTED_IDEA_DESCRIPTION', state.idea.description)}`,
      ].join('\n'),
    },
  ];
}

/** Normalizes a classification result into reducer-compatible frontier. */
export function normalizeClassifyOutput(out: ClassifyOutput) {
  return {
    domain: out.domain,
    open: out.open.map((p) => ({ ...p, status: 'open' as const })),
  };
}
