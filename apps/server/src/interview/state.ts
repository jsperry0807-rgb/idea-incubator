import type {
  DecisionPoint,
  IdeaProjectType,
  PlanningSectionName,
  Question,
  Synthesis,
} from '@repo/shared';

export type InterviewPhase = 'CLASSIFY' | 'ASK' | 'SYNTHESIZE' | 'READY' | 'DONE';

export interface InterviewDomain {
  primary: string;
  confidence: number;
  signals: string[];
}

export interface InterviewDecision {
  pointId: string;
  optionId: string;
  value: string;
  openedPointIds: string[];
  closedPointIds: string[];
  deferred: boolean;
  blocks: PlanningSectionName[];
  at: string;
}

export interface StuckMarker {
  pointId: string;
  attempts: number;
}

export interface InterviewSnapshot {
  id: string;
  title: string;
  description: string | null;
  projectType: IdeaProjectType;
}

/**
 * Atomic reducer state, persisted as a single `Json` column on `Interview`.
 *
 * `current` holds the rendered question for the current `ASK` turn so the
 * panel can rehydrate after a refresh without paying for another model call.
 * State shape churn is absorbed by the `Json` column (see `architecture.md`).
 */
export interface InterviewState {
  idea: InterviewSnapshot;
  domain: InterviewDomain | null;
  decisions: Record<string, InterviewDecision>;
  open: DecisionPoint[];
  asked: string[];
  stuck: StuckMarker | null;
  current: Question | null;
  synthesis: Synthesis | null;
  coverage: Record<PlanningSectionName, number>;
  phase: InterviewPhase;
  turn: number;
}

/** Hard termination cap per interview (runaway + budget guard). */
export const MAX_TURNS = 40;

/** Number of non-committal answers on one point before `SYNTHESIZE` fires. */
export const STUCK_ATTEMPTS = 2;

export type Coverage = InterviewState['coverage'];

export function emptyCoverage(): Coverage {
  return {
    overview: 0,
    'tech-stack': 0,
    features: 0,
    timeline: 0,
    risks: 0,
    pages: 0,
    content: 0,
    seo: 0,
    mechanics: 0,
    progression: 0,
    'art-audio': 0,
    playtest: 0,
    'supply-chain': 0,
    'unit-economics': 0,
  };
}
