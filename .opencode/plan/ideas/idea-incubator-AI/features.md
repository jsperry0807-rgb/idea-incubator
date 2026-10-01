# Features

## Phase 1: Foundation — Project Types + Interview Contracts

Unblocks the prototype. Physical products and SaaS are not representable
today, so the three seed ideas cannot all run.

### Server

- [ ] Prisma: add `SAAS` and `PHYSICAL` to `IdeaProjectType`; migration
- [ ] Shared: extend `IDEA_PROJECT_TYPE_VALUES` in `packages/shared/src/enums.ts`
- [ ] Shared: add `projectType` to `updateIdeaSchema`, preserving the existing
      non-empty `.refine` guard
- [ ] Server: extend `OVERVIEW_BY_TYPE`, `CREATED_SECTIONS_BY_TYPE`, and
      `ON_DEMAND_SECTIONS` in `planningTemplates.ts`; `SAAS` inherits the
      `SOFTWARE` set, `PHYSICAL` gets supply-chain/fulfilment sections
- [ ] Server: `assertIdeaOwnership` covers reclassification; add route for
      changing `projectType` on an existing idea
- [ ] Server: `Interview` model + migration (`state Json`, cascades from
      `Idea`); regenerate Prisma client
- [ ] Server: `llm.service.ts` behind an `LlmClient` interface; provider keys
      added to `config/env.ts` following the existing Zod pattern
- [ ] QA: typecheck / lint / build; create one idea of each of the five types
      and confirm the correct sections scaffold

### Shared

- [ ] `schemas/interview.ts` — `DecisionPoint`, `Question`, `QuestionOption`,
      `Synthesis`, answer/defer request schemas, DTOs

### Client

- [ ] Create Idea form: new `SAAS` / `PHYSICAL` pills
- [ ] Idea meta: project type becomes editable, not creation-locked
- [ ] i18n: new type labels (en, es, fr)

**Deliverable:** all five project types creatable and reclassifiable; interview
contracts in `@repo/shared`.

---

## Phase 2: Core — Reducer Engine + LLM Wiring

The heart of the feature. All domain logic is pure and testable before any UI
exists.

### Server

- [ ] `interview/state.ts` — `InterviewState` types
- [ ] `interview/reducer.ts` — `advance(state, event) -> { state, directives }`;
      no I/O anywhere in this file
- [ ] `interview/validate.ts` — `assertValidQuestion` enforcing non-empty
      `eliminatesPaths` and ≥2 options
- [ ] `interview/prompts/classify.ts` — domain + initial P0/P1 frontier
- [ ] `interview/prompts/question.ts` — render a `DecisionPoint` as a
      trade-off question
- [ ] `interview/prompts/reevaluate.ts` — answer → open/close/invalidate sets
- [ ] `interview/graph.ts` — directive resolution loop; the only place LLM
      calls happen
- [ ] `interview.service.ts` — load/save state, resolve directives, enforce
      turn caps
- [ ] `interview.routes.ts` — start/resume, get state, answer; owner-only
- [ ] Register in `routes/index.ts`; add per-interview and per-user rate limits
- [ ] Structured output via Zod → JSON schema; retry once on validation failure
- [ ] Locale passed into every prompt

### QA

- [ ] Reducer unit tests with zero network access
- [ ] Manual trace: run the "clicker game" seed, confirm `hybrid` on
      `core-loop` opens `upgrade-cadence` and `prestige-layer`

**Deliverable:** a headless engine that can hold a complete branching
interview. No UI required.

---

## Phase 3: Core — Golden Traces + Synthesis

### Server

- [ ] `interview/fixtures/` — three seed ideas: clicker game, SaaS tool,
      physical product
- [ ] `interview/prompts/synthesis.ts` — ported 3-bullet verdict
      (Recommendation / Key Tradeoffs / Strongest Disagreement) against our own
      `LlmClient`; no MCP dependency
- [ ] Stuck detection: `attempts >= 2` on the same point triggers synthesis
- [ ] `POST /interview/synthesis` — manual "I'm stuck" override
- [ ] `POST /interview/defer` — records to `## Assumptions` in `overview.md`
- [ ] Stronger model routed for synthesis only; cheaper model for question
      prose
- [ ] Classification result cached per interview

### QA

- [ ] Golden-trace tests asserting **branch structure, not wording**
- [ ] Synthesis latency budget verified (target < 6s)

**Deliverable:** stuck users get a real multi-perspective verdict; branch
behavior is regression-guarded.

---

## Phase 4: Core — Plan Generation

### Server

- [ ] `interview/prompts/plan.ts` — one section at a time, grounded in
      `decisions`
- [ ] `plan.service.ts` — target sections from existing
      `sectionsForType(projectType).created` (reuse; do not duplicate the list)
- [ ] Every section records `groundedBy[]` and labels inferred content
- [ ] Write via `writePlanningSection(userId, ideaId, section, content)`
      directly — no HTTP hop, inherits `assertIdeaOwnership`
- [ ] Create `Task` rows grouped by timeline milestones
- [ ] `POST /interview/plan` returns a **diff preview only**
- [ ] `PUT /interview/plan` applies the preview on explicit confirm
- [ ] Snapshot existing section content before any write

### QA

- [ ] Assert generation writes 11 markdown files + `Task` rows (there is no
      `tasks` planning section — it is the `Task` model)
- [ ] Assert no existing hand-edited content is silently overwritten

**Deliverable:** a plan the user reviews as a diff, then applies.

---

## Phase 5: Polish — Client Panel

### Client

- [ ] `features/interview/` — `api/`, `hooks/`, `components/`, following the
      existing ideas feature structure
- [ ] Interview panel on `IdeaDetailPage`, near `PlanningAccordion`
- [ ] Question card: `what` / `why` / trade-off option table / labelled default
- [ ] Free-text fallback alongside option selection
- [ ] Skipped-answer path (feeds stuck detection)
- [ ] Synthesis card: three labelled sections
- [ ] Decision log: collapsible, every decision + what it opened/closed
- [ ] Plan review diff modal with per-section approve
- [ ] `useInterview` / `useAnswer` hooks invalidating planning queries on apply
- [ ] Pending states per phase — the panel must not read as hung during a
      multi-second model call
- [ ] i18n: all chrome strings (en, es, fr); model output generated in the
      user's locale
- [ ] Keyboard navigable option table; options reachable without a mouse

**Deliverable:** a usable interview panel in the app.

---

## Phase 6: Polish — Tests, CI, Tail Collection

### Server

- [ ] `vitest` configured for `apps/server`
- [ ] Reducer unit tests, directive resolution tests, plan-writer output tests
- [ ] `msw` handlers for LLM HTTP
- [ ] Root `lint` script fixed to be recursive — it currently hardcodes
      `--filter @repo/client` and never lints the server
- [ ] CI: add `pnpm test` to `.github/workflows/ci.yml`
- [ ] Chatfield tail collection (~15 fields: budget, team size, deadline,
      platforms, monetization) behind `CHATFIELD_ENABLED`, default off
- [ ] Interview analytics: log decision point IDs, defer rates, synthesis
      triggers — feeds the "which points stall users?" question

**Deliverable:** the feature is regression-guarded and CI actually exercises
it.
