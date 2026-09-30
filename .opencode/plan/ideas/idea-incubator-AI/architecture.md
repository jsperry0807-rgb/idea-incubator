# Architecture

## Design Decision: Pure Reducer, Not LangGraph

The interview is a ~6-node state machine. What a graph framework actually buys
is durable checkpointing, time-travel, and human-in-the-loop interrupts. We
need persistence, and we already own Postgres and Prisma — that is one table
and one row.

The cost of LangGraph here is a heavy dependency and coupling our domain
logic to an external state shape, for a machine that is one `switch`. The
reducer is ~100 lines, pure, and testable with no network and no mocks.

If branching complexity grows past roughly a dozen decision-point types, or
we need true time-travel debugging, migrating to LangGraph later is a
contained refactor because **all** domain logic stays in pure functions that
the graph would merely orchestrate.

## Core Principle: Directives, Not Side Effects

The reducer never performs I/O. It returns *directives* describing what the
caller must fetch. The route resolves directives with LLM calls and feeds
results back as events.

```
advance(state, event) -> { state, directives }
```

This is the single most important property in the design. It means the entire
branching engine — the part that must be correct — is exercised by unit tests
with no network access and no model mocks.

## State Shape

```ts
type InterviewPhase =
  | "CLASSIFY" | "ASK" | "SYNTHESIZE" | "READY" | "DONE";

type InterviewState = {
  idea: {
    id: string;
    title: string;
    description: string | null;
    projectType: IdeaProjectType;
  };
  domain: {
    primary: string;          // "incremental-game", "b2b-saas", "physical-goods"
    confidence: number;       // 0..1
    signals: string[];        // evidence quoted from the user's own words
  };
  decisions: Record<string, Decision>;
  open: DecisionPoint[];      // the frontier
  asked: string[];            // point ids in order, for re-ask suppression
  stuck: { pointId: string; attempts: number } | null;
  synthesis: Synthesis | null;
  coverage: Record<PlanningSectionName, number>;  // 0..1 grounded-ness
  phase: InterviewPhase;
  turn: number;
};

type Decision = {
  pointId: string;
  optionId: string;          // or "free-text"
  value: string;
  openedPointIds: string[];  // what this answer made newly reachable
  closedPointIds: string[];
  deferred: boolean;
  at: string;                // ISO timestamp
};
```

`decisions` holds only resolved points. `open` is the frontier. `asked` is
append-only and is what makes re-asking mechanically impossible.

## Decision Point Model

```ts
type Priority = "P0" | "P1" | "P2" | "P3";

type DecisionPoint = {
  id: string;                 // STABLE — the anti-template mechanism
  title: string;
  why: string;                // the architectural consequence
  priority: Priority;
  eliminatesPaths: string[];  // MUST be non-empty — enforced, see below
  blocks: PlanningSectionName[];
  opensWhen?: DecisionPoint[];  // reachable only via specific upstream answers
  status: "open" | "resolved" | "deferred";
};
```

### Why `eliminatesPaths` is the enforcement mechanism

The product requirement is "never pulled from a static template." Left as a
prompt instruction, that degrades over time as prompts get edited. So it is
made a **runtime invariant** instead:

```ts
function assertValidQuestion(point: DecisionPoint, question: Question): void {
  if (point.eliminatesPaths.length === 0) {
    throw new Error(`Decision point ${point.id} eliminates no implementation path`);
  }
  if (question.options.length < 2) {
    throw new Error(`Question for ${point.id} offers no trade-off`);
  }
}
```

A question that cannot demonstrate it eliminated a path never reaches the
user. This is the mechanical form of the "Minimum Viable Question" principle
from the LotusADSP skill, and it is the reason we do not import that skill's
domain question banks — the banks *are* static templates, and the validator
would reject their premise.

## Priority Tiers

| Tier | Meaning | Gate |
| ---- | ------- | ---- |
| P0 | Cannot generate a valid plan without it | Must be resolved before `READY` |
| P1 | Affects >30% of the implementation | Resolved or explicitly deferred |
| P2 | Affects one specific feature or section | Optional |
| P3 | Edge case, optimization, nice-to-have | Rarely asked |

## Node Flow

```
CLASSIFY ──► selectPoint ──► ASK ──► ANSWERED ──► applyAnswer ──► reassess
                ▲                                              │
                │                              ┌───────────────┼──────────────┐
                └──────────────────────────────┤               │              │
                                       attempts < 2        attempts >= 2    all P0 clear
                                               │               │         + coverage ok
                                          loop ASK        SYNTHESIZE         │
                                                                │          READY
                                                                └──────► applyAnswer
                                                                          │
                                                                          ▼
                                                                     generatePlan
                                                                          │
                                                                          ▼
                                                                         DONE
```

- **CLASSIFY** — runs once per interview. Produces `domain` and the initial
  P0/P1 frontier. Cached; never re-run.
- **selectPoint** — highest priority unresolved point not in `asked[]`. Pure.
- **ASK** — model renders the selected point as a `Question` with a trade-off
  option table. Validated against `assertValidQuestion`.
- **applyAnswer** — records the decision, then **re-evaluates**: closes points
  the answer satisfies, invalidates points the answer contradicts, and opens
  the points the answer made reachable. This is the branch.
- **SYNTHESIZE** — fires when `attempts >= 2` on the same point. See below.
- **reassess** — computes `coverage` per section. Derives required sections
  from the existing `sectionsForType(projectType).created`, so there is no
  second copy of the section list to drift.
- **generatePlan** — writes planning docs. See `features.md`.

## Worked Branch Example

```
Input: "I want to make a clicker game"

CLASSIFY
  domain.primary    = "incremental-game"  (confidence 0.9)
  open (P0)         = core-loop, idle-vs-active
  open (P1)         = theme
  open (P2)         = monetization

Q1  selectPoint -> core-loop (P0)
    options: pure-incremental | active-minigame | hybrid
    user    : "hybrid"

applyAnswer
  closes  core-loop
  opens   upgrade-cadence, prestige-layer, session-length
          (all three unreachable from pure-incremental)
  re-evaluates: theme demoted P1 -> P2 (now that a loop exists, theme is
                cosmetic rather than structural)

Q2  selectPoint -> upgrade-cadence (P0, newly opened)
```

Q2 is **not** the pre-authored theme question. That is the whole feature.

## Stuck Synthesis

Trigger: `stuck.attempts >= 2` on the same point — the user has skipped or
given a non-committal answer twice.

Returns a `Synthesis`:

```ts
type Synthesis = {
  recommendation: string;
  keyTradeoffs: string[];
  strongestDisagreement: string;
  forPointId: string;
};
```

Ported from brainstorm-mcp's Socratic-style debate and 3-bullet verdict, but
reimplemented as a prompt plus structured parse against our own LLM client.

**Why not wire the MCP server:** `spranab/brainstorm-mcp` is a stdio MCP server
for coding agents — not a library and not an HTTP API, so the Express backend
cannot depend on it. It is also tuned for a developer at a terminal, where a
multi-round multi-model debate is worth the latency. An end-user web turn has
a budget of a couple of seconds. We take the output format and the prompt
shape; we drop the orchestration and the multi-provider fan-out.

If the user then defers, the outcome is recorded in `## Assumptions` in
`overview.md`.

## Persistence

```prisma
model Interview {
  id     String @id @default(cuid())
  ideaId String
  userId String
  phase  String @default("CLASSIFY")
  state  Json
  idea   Idea   @relation(fields: [ideaId], references: [id], onDelete: Cascade)

  @@index([ideaId])
}
```

`state` is `Json` rather than normalized rows because the reducer performs one
atomic read-modify-write. Normalized `Question`/`Answer` tables would
introduce partial-update failure modes for no current benefit, and the whole
interview stays queryable as one value for debugging.

Promote to a separate `InterviewTurn` table only if cross-idea analytics
("which decision points stall users most?") becomes a real requirement. That
is a genuinely useful question to answer with real data, and worth revisiting
after launch.

## Plan Generation

`generatePlan` is a terminal node, not part of the interview loop.

1. Determine target sections via the existing
   `sectionsForType(projectType).created` from
   `apps/server/src/lib/planningTemplates.ts` — reuse, do not duplicate.
2. For each section, generate markdown **grounded in `decisions`**.
3. Every section records which decisions grounded it and labels inferred
   content explicitly. This distinction is the entire value of running an
   interview instead of calling a model once.
4. Call `writePlanningSection(userId, ideaId, section, content)` as a direct
   service call — no HTTP hop, and it inherits the existing
   `assertIdeaOwnership` check.
5. Create `Task` rows grouped by timeline milestones.

**Task reality check:** there is no `tasks` planning section. The 12 canonical
sections are `overview, tech-stack, features, timeline, risks, pages, content,
seo, mechanics, progression, art-audio, playtest`. "Tasks grouped by
milestone" is the separate `Task` model with its own CRUD API. So generation
writes 11 markdown files and creates `Task` rows — not 12 files.

## Pre-Write Safety

The agent never silently overwrites. Before writing:

- Snapshot existing section content
- Produce a diff against what is on disk
- Surface the diff for approval

This matters because users are already hand-editing these markdown files by
hand through the existing editor, and a generated overwrite would destroy work
the agent never saw.

## Module Layout

```
packages/shared/src/schemas/interview.ts    DecisionPoint / Question / Synthesis Zod contracts
apps/server/src/interview/
  state.ts                                  InterviewState types
  reducer.ts                                advance(state, event) — pure, no I/O
  validate.ts                               assertValidQuestion + friends
  graph.ts                                  directive resolution loop (I/O lives here)
  prompts/
    classify.ts                             domain + initial frontier
    question.ts                             DecisionPoint -> Question
    reevaluate.ts                           apply answer -> open/close sets
    synthesis.ts                            ported 3-bullet verdict
    plan.ts                                 section -> markdown
  fixtures/                                 3 seed ideas for golden traces
apps/server/src/services/llm.service.ts     LlmClient interface + provider impl
apps/server/src/services/interview.service.ts   persistence + directive resolution
apps/server/src/services/plan.service.ts        markdown + Task row generation
apps/server/src/routes/interview.routes.ts
```
