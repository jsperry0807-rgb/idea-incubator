# Idea Incubator AI — Socratic Interview Agent Roadmap

Continues from Phase 10 (wireframes, week 22).

## Timeline

| Phase | Weeks | Focus                                                                                  |
| ----- | ----- | -------------------------------------------------------------------------------------- |
| 11    | 23–24 | Project types (`SAAS` / `PHYSICAL`), reclassification, interview contracts, LLM client |
| 12    | 25–27 | Pure reducer engine, prompts, graph loop, interview routes                             |
| 13    | 28–29 | Golden traces, stuck detection, synthesis node                                         |
| 14    | 30–31 | Plan generation, diff preview, Task rows                                               |
| 15    | 32–33 | Client interview panel, decision log, plan review                                      |
| 16    | 34    | Tests, CI fixes, tail collection behind flag                                           |

**Total: ~12 weeks**

---

## Phase 11: Project Types + Interview Contracts (Weeks 23-24)

**Goal:** Widen the type enum so every idea domain is representable, and land the shared contracts the engine will use.

- [ ] Prisma: add `SAAS` and `PHYSICAL` to `IdeaProjectType`; migration; regenerate client
- [ ] Shared: extend `IDEA_PROJECT_TYPE_VALUES`; add `projectType` to `updateIdeaSchema` (type is currently locked at creation and uncorrectable)
- [ ] Server: extend `OVERVIEW_BY_TYPE` / `CREATED_SECTIONS_BY_TYPE` / `ON_DEMAND_SECTIONS`; `SAAS` inherits the `SOFTWARE` set, `PHYSICAL` gets supply-chain sections
- [ ] Server: reclassification route with `assertIdeaOwnership`
- [ ] Server: `Interview` model (`state Json`, cascades from `Idea`) + migration
- [ ] Server: `llm.service.ts` behind an `LlmClient` interface; keys added to `config/env.ts` via the existing Zod pattern
- [ ] Shared: `schemas/interview.ts` — `DecisionPoint`, `Question`, `QuestionOption`, `Synthesis`, request/DTO schemas
- [ ] Server: `vitest` configured (the reducer is pure; this is where the test suite starts)
- [ ] Client: `SAAS` / `PHYSICAL` pills; project type editable after creation
- [ ] Client/i18n: type labels (en, es, fr)
- [ ] QA: typecheck/lint/build; create one idea of each of the five types and confirm correct scaffolding

**Deliverable:** all five project types creatable and reclassifiable; `Interview` persisted; interview contracts in `@repo/shared`. Nothing else in this roadmap can start until this lands — a physical product is currently unrepresentable.

---

## Phase 12: Reducer Engine + LLM Wiring (Weeks 25-27)

**Goal:** A headless engine that holds a complete branching interview, with all domain logic pure and unit-tested.

- [ ] `interview/state.ts` — `InterviewState` types
- [ ] `interview/reducer.ts` — `advance(state, event) -> { state, directives }`; zero I/O in this file
- [ ] `interview/validate.ts` — `assertValidQuestion`: reject empty `eliminatesPaths`, reject single-option questions
- [ ] `interview/prompts/classify.ts` — domain + initial P0/P1 frontier
- [ ] `interview/prompts/question.ts` — `DecisionPoint` → trade-off question
- [ ] `interview/prompts/reevaluate.ts` — answer → open/close/invalidate sets
- [ ] `interview/graph.ts` — directive resolution loop; the only place LLM calls live
- [ ] `interview.service.ts` — state load/save, directive resolution, turn caps
- [ ] `interview.routes.ts` — start/resume, get state, answer; owner-only (no `EDIT`/`VIEW` access to raw idea text)
- [ ] Register in `routes/index.ts`; per-interview, per-user, and synthesis rate limits
- [ ] Structured output via Zod → JSON schema; one retry on validation failure
- [ ] Locale threaded into every prompt
- [ ] QA: reducer unit tests, no network; manual trace confirming `hybrid` on `core-loop` opens `upgrade-cadence` + `prestige-layer`

**Deliverable:** headless branching interview. The engine is validated before any UI is built, because the branching is the risky part and it is fully exercisable without a browser.

---

## Phase 13: Golden Traces + Synthesis (Weeks 28-29)

**Goal:** Turn observed behavior into a regression-guarded spec, and stop stuck users from looping.

- [ ] `interview/fixtures/` — three seed ideas (clicker game, SaaS tool, physical product)
- [ ] Golden tier: hand-authored branch-structure expectations, run in CI with no API key
- [ ] Observed tier: regeneration script producing real transcripts, reviewed as a diff (never auto-committed)
- [ ] `interview/prompts/synthesis.ts` — ported 3-bullet verdict (Recommendation / Key Tradeoffs / Strongest Disagreement) against our own `LlmClient`
- [ ] Stuck detection: `attempts >= 2` on the same point emits a `SYNTHESIZE` directive
- [ ] `POST /interview/synthesis` — manual "I'm stuck" override
- [ ] `POST /interview/defer` — records the outcome to `## Assumptions` in `overview.md`
- [ ] Model routing: stronger model for synthesis only, cheaper for question prose; classification cached once
- [ ] QA: synthesis latency budget verified (< 6s)

**Deliverable:** stuck users get a genuine multi-perspective verdict; branch behavior is regression-guarded. No `brainstorm-mcp` dependency — it is a stdio MCP server for coding agents, not something Express can call. Its output format is ported; its orchestration is not.

---

## Phase 14: Plan Generation (Weeks 30-31)

**Goal:** Turn resolved decisions into a plan the user reviews before anything is written.

- [ ] `interview/prompts/plan.ts` — one section at a time, grounded in `decisions`
- [ ] `plan.service.ts` — target sections from the existing `sectionsForType(projectType).created` (reuse; do not duplicate the list)
- [ ] Every section records `groundedBy[]` and explicitly labels inferred content
- [ ] Write via `writePlanningSection(userId, ideaId, section, content)` directly — no HTTP hop, inherits `assertIdeaOwnership`
- [ ] Create `Task` rows grouped by timeline milestones
- [ ] Snapshot existing section content before any write
- [ ] `POST /interview/plan` — diff preview only, writes nothing
- [ ] `PUT /interview/plan` — applies on explicit `confirm: true`
- [ ] QA: assert 11 markdown files + `Task` rows (there is no `tasks` planning section — it is the `Task` model); assert no hand-edited content is overwritten

**Deliverable:** a reviewable diff that populates the app's existing planning docs plus milestone-grouped tasks.

---

## Phase 15: Client Interview Panel (Weeks 32-33)

**Goal:** Ship the conversation in the app.

- [ ] `features/interview/` — `api/`, `hooks/`, `components/` following the existing ideas feature structure
- [ ] Panel on `IdeaDetailPage` near `PlanningAccordion`
- [ ] Question card: `what` / `why` / trade-off option table / labelled default with rationale
- [ ] Free-text fallback alongside option selection
- [ ] Skip path (feeds stuck detection)
- [ ] Synthesis card: three labelled sections
- [ ] Decision log: every decision plus what it opened and closed
- [ ] Plan review diff modal with per-section approve
- [ ] `useInterview` / `useAnswer` hooks; planning queries invalidate on apply
- [ ] Distinct pending state per phase — the panel must not read as hung during a multi-second call
- [ ] Keyboard-navigable option table
- [ ] i18n: chrome strings (en, es, fr); model output generated in the user's locale

**Deliverable:** a usable one-question-at-a-time interview with stuck-resolution and plan review.

---

## Phase 16: Tests, CI, Tail Collection (Weeks 34)

**Goal:** Make the whole thing regression-guarded and fix the CI gaps that would otherwise leave it unguarded.

- [ ] Vitest suites across all five layers (see `testing.md`)
- [ ] `msw` handlers for LLM HTTP
- [ ] Root `lint` made recursive — it currently hardcodes `--filter @repo/client` and never lints the server
- [ ] CI: add `pnpm test` to `.github/workflows/ci.yml`
- [ ] Chatfield tail collection (~15 fields: budget, team size, deadline, platforms, monetization) behind `CHATFIELD_ENABLED`, default off
- [ ] Interview analytics: log decision point IDs, defer rates, synthesis triggers — feeds the "which points stall users most?" question
- [ ] QA: full three-seed walkthrough + typecheck/lint/build

**Deliverable:** CI actually exercises the feature. Tail collection ships disabled.

---

## Deferred

| Item                                | Trigger to revisit                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| LangGraph migration                 | Branch complexity grows past ~12 decision-point types, or time-travel debugging becomes necessary |
| SSE streaming for turns             | Users report perceived slowness (non-streaming ships first)                                       |
| `InterviewTurn` as a real table     | Cross-idea analytics of decision points becomes a real question                                   |
| Shared/collab interviews            | An `EDIT` collaborator requests access; needs a permissions redesign first                        |
| Physical-product section refinement | Real usage shows the initial supply-chain set is wrong                                            |
