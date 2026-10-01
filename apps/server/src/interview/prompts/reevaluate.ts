import { z } from 'zod';

import { decisionPointSchema } from '@repo/shared';
import type { InterviewState } from '../state';
import type { Answer } from '../reducer';
import type { LlmMessage } from '../../services/llm.service';

export const reevaluateOutputSchema = z.object({
  opened: z.array(decisionPointSchema).max(10),
  closed: z.array(z.string()).max(10),
  invalidated: z.array(z.string()).max(10),
});

export type ReevaluateOutput = z.infer<typeof reevaluateOutputSchema>;

/**
 * Builds messages that reassess the frontier after an answer.
 *
 * The model may open consequential points, close constraints the answer makes
 * moot, or invalidate previously-open points that the answer now contradicts.
 */
export function buildReevaluateMessages(
  state: InterviewState,
  answer: Answer,
  locale: string
): LlmMessage[] {
  const answeredPoint = state.open.find((p) => p.id === answer.pointId);
  const knownPoints = new Set(state.open.map((p) => p.id));

  return [
    {
      role: 'system',
      content: [
        'You maintain a frontier of open decision points for a product planning interview after each answer.',
        'Return three lists as JSON:',
        '- opened: NEW points to explore next (only points not already in the open set). Each needs eliminatesPaths with at least one path.',
        '- closed: ids of points (from the open set) whose alternatives are now settled by this answer.',
        '- invalidated: ids of points (from the open set) this answer contradicts — they are removed from the plan entirely.',
        'Rules:',
        '- Never put the just-answered point in `closed` or `invalidated`.',
        '- Keep the frontier small. Prefer quality: a half-dozen well-chosen points beats a sprawling list.',
        '- If nothing changes, return empty arrays.',
        `Respond in ${locale}.`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Project type: ${state.idea.projectType}`,
        `Idea: ${state.idea.title}`,
        state.idea.description ? `Description: ${state.idea.description}` : 'Description: (none)',
        `Domain: ${state.domain?.primary ?? 'unknown'}`,
        `Decisions so far:`,
        Object.values(state.decisions).length === 0
          ? '  (none)'
          : Object.values(state.decisions)
              .map((d) => `  - ${d.pointId}: "${d.optionId}" ${d.value.slice(0, 120)}`)
              .join('\n'),
        `Open frontier:`,
        state.open.length === 0
          ? '  (empty)'
          : state.open.map((p) => `  - [${p.priority}] ${p.id}: ${p.title}`).join('\n'),
        '',
        'The user just answered:',
        `  pointId: ${answer.pointId}${answeredPoint ? ` (${answeredPoint.title})` : ''}`,
        `  optionId: ${answer.optionId}`,
        `  value: ${answer.value}`,
        answer.freeText ? `  freeText: ${answer.freeText}` : '  freeText: (none)',
        '',
        `Return opened as new points, with ids that do NOT collide with ${JSON.stringify(
          Array.from(knownPoints)
        )}.`,
      ].join('\n'),
    },
  ];
}

/**
 * Normalizes a reevaluation result. Forces `status: "open"` on opened points
 * and strips the answered point from `closed`/`invalidated` defensively.
 */
export function normalizeReevaluateOutput(out: ReevaluateOutput, answer: Answer) {
  return {
    opened: out.opened
      .filter((p) => p.id !== answer.pointId)
      .map((p) => ({ ...p, status: 'open' as const })),
    closed: out.closed.filter((id) => id !== answer.pointId),
    invalidated: out.invalidated.filter((id) => id !== answer.pointId),
  };
}
