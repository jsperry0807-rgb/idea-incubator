import type { DecisionPoint, Question } from '@repo/shared';

import { ValidationError } from '../lib/errors';

/**
 * Runtime enforcement of the "Minimum Viable Question" invariant.
 *
 * A question that cannot demonstrate it eliminated an implementation path
 * never reaches the user. This is mechanical, not a prompt discipline — the
 * validator is why the static-template failure mode cannot silently reappear
 * as prompts get edited.
 */
export function assertValidQuestion(point: DecisionPoint, question: Question): void {
  if (point.eliminatesPaths.length === 0) {
    throw new ValidationError(
      { pointId: point.id },
      `Decision point ${point.id} eliminates no implementation path`
    );
  }

  if (question.options.length < 2) {
    throw new ValidationError(
      { pointId: point.id, optionCount: question.options.length },
      `Question for ${point.id} offers no trade-off`
    );
  }
}

/**
 * Validates a frontier (set of open decision points) before it is admitted
 * into reducer state. Every open point must eliminate at least one path,
 * otherwise the frontier itself is template-shaped.
 */
export function assertValidFrontier(points: DecisionPoint[]): void {
  for (const point of points) {
    if (point.eliminatesPaths.length === 0) {
      throw new ValidationError(
        { pointId: point.id },
        `Decision point ${point.id} eliminates no implementation path`
      );
    }
  }
}
