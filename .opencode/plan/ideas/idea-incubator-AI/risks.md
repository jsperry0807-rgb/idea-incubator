# Risks

## Open Risks

| Risk                                                              | Likelihood | Impact | Mitigation                                                                                                                                                |
| ----------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generated plan silently overwrites hand-edited markdown           | High       | High   | Diff preview returns content only; writes require a separate explicit confirm call; snapshot before write                                                 |
| Model proposes questions that aren't genuinely blocking           | High       | Med    | `eliminatesPaths` non-empty is a runtime invariant (`assertValidQuestion`), not a prompt instruction; priority tiers gate selection                       |
| Interview never terminates                                        | Med        | High   | Hard 40-turn cap; `READY` requires all P0 resolved plus a coverage threshold; P3 points rarely asked                                                      |
| Per-turn LLM cost runs away                                       | Med        | High   | Three-tier rate limits (40/turn, 60/hr, synthesis 10/hr); classification cached once; cheaper model for question prose, stronger model for synthesis only |
| Turns take seconds and the UI reads as hung                       | High       | Med    | Distinct pending state per phase; non-streaming shipped first with skeletons; streaming deferred as a follow-up if users report slowness                  |
| Interview state shape churns as prompts are tuned                 | High       | Med    | `Json` column absorbs schema changes with no migration; the reducer's typed surface is small and pure, so refactors are local                             |
| Interview state contains raw idea text and is over-shared         | Low        | High   | Owner-only on every route, no exception for `EDIT`/`VIEW` collaborators; state never returned in list endpoints                                           |
| Model output fails validation or returns malformed JSON           | Med        | Med    | Zod → JSON schema structured output; one automatic retry; a third failure surfaces a clear error rather than a broken panel                               |
| Prompts drift toward the static templating we are avoiding        | Med        | High   | The `eliminatesPaths` validator rejects template-shaped questions at runtime; golden traces assert branch structure, not wording                          |
| Zero existing test coverage leaves the reducer unverified         | High       | High   | Vitest is in Phase 11, not deferred to polish; reducer is pure specifically so it is testable with no mocks                                               |
| Root `lint` only covers the client, so server code ships unlinted | High       | Med    | Fixed in Phase 16 by making the script recursive; add `pnpm test` to CI                                                                                   |
| Cost of a full interview exceeds free-tier users' patience        | Med        | Med    | Interview is opt-in per idea, not automatic; users can start from the decision log and answer only P0s                                                    |
| `PHYSICAL` section set is under-specified                         | Med        | Med    | Scaffold minimally (overview, tech-stack, features, timeline, risks + supply-chain); refine after real usage rather than guessing up front                |
| Model locale handling produces mixed-language options             | Med        | Low    | Locale passed into every prompt; generated content needs no client-side translation table                                                                 |

## Resolved Risks

| Risk                                                   | Outcome                                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LangGraph dependency for a 6-node machine              | Resolved — not adopted. Pure reducer + one Postgres row. Logic stays in pure functions so a later migration stays contained                                                     |
| Cannot wire `brainstorm-mcp` from Express              | Resolved — it is a stdio MCP server for coding agents, not a library or HTTP API. Its 3-bullet synthesis format is ported as a prompt against our own `LlmClient`               |
| Chatfield for the questioning phase                    | Resolved — rejected. It requires a schema known up front, which defeats dynamic decision-point discovery. Tail-only, ~15 fields, flag-gated                                     |
| LotusADSP `brainstorming` skill as the behavior source | Resolved — principles adopted, domain banks rejected. Its banks cover only E-Commerce / Auth / Real-time / CMS and are static templates, which contradicts the core requirement |
| Observed branching behavior as the spec                | Resolved — impossible. The skill's branching is an LLM reading a prompt at authoring time, with no runtime or state. Replaced with golden traces as the executable spec         |
| Physical product not representable in the data model   | Resolved — `PHYSICAL` and `SAAS` added to the enum with a reclassification path                                                                                                 |
| `projectType` immutable after creation                 | Resolved — added to `updateIdeaSchema`; wrong type produces an entirely wrong document set for generated plans                                                                  |
| No `tasks` planning section to write tasks into        | Resolved — confirmed: the 12 canonical sections contain no `tasks`. "Tasks grouped by milestone" is the `Task` model. Generation writes 11 files plus `Task` rows               |
| Sticking-point loop repeating forever                  | Resolved — synthesis fires at `attempts >= 2`, plus a manual override button and a defer path                                                                                   |
