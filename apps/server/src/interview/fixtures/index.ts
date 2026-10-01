import type { IdeaProjectType } from '@repo/shared';

/**
 * Golden-trace seed ideas.
 *
 * These are the executable spec for the branching engine: three very different
 * ideas whose expected *branch structure* is hand-authored in
 * `golden-traces.test.ts`. Wording is never asserted — see `testing.md`.
 */

export interface SeedIdea {
  id: string;
  title: string;
  description: string;
  projectType: IdeaProjectType;
}

/** GAME — the worked branch from `architecture.md`: hybrid on `core-loop`. */
export const CLICKER_GAME: SeedIdea = {
  id: 'seed-clicker-game',
  title: 'Cookie Tycoon',
  description:
    'An idle cookie clicker where tapping bakes cookies and upgrades automate the tapping.',
  projectType: 'GAME',
};

/** SAAS — a different frontier, proving the engine is domain sensitive. */
export const SAAS_TOOL: SeedIdea = {
  id: 'seed-saas-tool',
  title: 'Churn Radar',
  description:
    'A B2B dashboard that watches customer usage data and flags accounts about to churn.',
  projectType: 'SAAS',
};

/** PHYSICAL — a third section set, proving the project-type enum is real. */
export const PHYSICAL_PRODUCT: SeedIdea = {
  id: 'seed-physical-product',
  title: 'Pour-Over Kettle',
  description:
    'A gooseneck kettle with a built-in thermometer aimed at consistent pour-over coffee.',
  projectType: 'PHYSICAL',
};

export const SEED_IDEAS: readonly SeedIdea[] = [CLICKER_GAME, SAAS_TOOL, PHYSICAL_PRODUCT];

/* ------------------------------------------------------------------ */
/* Builders for hand-authored trace scripts                            */
/* ------------------------------------------------------------------ */

import type { PlanningSectionName } from '@repo/shared';
import type { ClassifyOutput } from '../prompts/classify';
import type { QuestionOutput } from '../prompts/question';
import type { ReevaluateOutput } from '../prompts/reevaluate';

/** A decision point for a trace script. Always eliminates at least one path. */
export function tracePoint(
  id: string,
  priority: 'P0' | 'P1' | 'P2' | 'P3',
  blocks: readonly PlanningSectionName[]
) {
  return {
    id,
    title: id.replace(/-/g, ' '),
    why: 'This point gates the plan.',
    priority,
    eliminatesPaths: [`${id}-path-a`, `${id}-path-b`],
    blocks: [...blocks],
    status: 'open' as const,
  };
}

export function traceQuestion(id: string, options: string[]): QuestionOutput {
  return {
    point: tracePoint(id, 'P0', []),
    prompt: `How should ${id} work?`,
    why: 'Because it gates the plan.',
    options: options.map((o) => ({
      id: o,
      label: o,
      consequence: `You pick ${o}.`,
    })),
    canSkip: true,
  };
}

export function traceClassify(
  primary: string,
  confidence: number,
  signals: string[],
  open: ClassifyOutput['open']
): ClassifyOutput {
  return { domain: { primary, confidence, signals }, open };
}

/** A reevaluation that changes nothing — the common case in a short trace. */
export const NO_CHANGE: ReevaluateOutput = {
  opened: [],
  closed: [],
  invalidated: [],
};
