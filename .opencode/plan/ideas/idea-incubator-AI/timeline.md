# Timeline

## Phases

| Phase | Weeks | Focus                                                                                  |
| ----- | ----- | -------------------------------------------------------------------------------------- |
| 11    | 23–24 | Project types (`SAAS` / `PHYSICAL`), reclassification, interview contracts, LLM client |
| 12    | 25–27 | Pure reducer engine, prompts, graph loop, interview routes                             |
| 13    | 28–29 | Golden traces, stuck detection, synthesis node                                         |
| 14    | 30–31 | Plan generation, diff preview, Task rows                                               |
| 15    | 32–33 | Client interview panel, decision log, plan review                                      |
| 16    | 34    | Tests, CI fixes, tail collection behind flag                                           |

**Total: ~12 weeks** (weeks 23–34, continuing from Phase 10 at week 22)

## Milestones

**M1 — Engine works headlessly (end of week 27)**
An interview can be driven end to end with no UI. All branching logic lives in
pure functions, the reducer is unit-tested with no network access, and the
"clicker game" seed demonstrably branches: choosing a hybrid core loop opens
`upgrade-cadence` and `prestige-layer`, which are unreachable from a
pure-incremental answer. A strong model could be swapped in without touching
the reducer.

**M2 — Users can plan with the agent (end of week 33)**
A user describes an idea, answers questions one at a time, can get a
multi-perspective verdict when stuck, and receives a plan as a reviewable diff
that populates the app's existing planning sections plus milestone-grouped
tasks. No hand-edited markdown is ever silently overwritten.

**M3 — Regression-guarded (end of week 34)**
The reducer, directive resolution, and plan writer are covered by tests; CI
runs them; the root `lint` script actually lints the server. Tail collection
ships disabled.

## Deliverables

- `IdeaProjectType` widened to five values with a working reclassification path
- `Interview` table with atomic `Json` state, cascading from `Idea`
- Pure `advance(state, event)` reducer with runtime enforcement that every
  question eliminates at least one implementation path
- Headless interview engine with a directive resolution loop
- Three golden traces covering clicker game, SaaS tool, and physical product
- Stuck synthesis returning Recommendation / Key Tradeoffs / Strongest
  Disagreement, ported from brainstorm-mcp's format with no MCP dependency
- Plan generation writing 11 planning sections plus milestone-grouped `Task`
  rows, with grounded-vs-inferred labelling
- Diff-preview-then-confirm write path protecting hand-edited markdown
- Client interview panel with keyboard-navigable trade-off tables
- Vitest + MSW in CI, and a fixed recursive `lint` script

## Sequencing Rationale

The engine (Phase 12) is built before the UI (Phase 15) deliberately. The
branching behavior is the risky, high-uncertainty part of this feature and it
is fully exercisable headlessly. Validating it before investing in a panel
avoids building an interface around behavior that later turns out to be wrong.

Plan generation (Phase 14) is likewise separated from the panel, and the
hand-rolled reducer is only revisited as a LangGraph candidate after real
usage data shows whether branch complexity is actually growing.

## Effort Notes

- Phase 11 is small but **blocking** — nothing can be prototyped until
  physical products are representable.
- Phase 12 is the largest. Prompt iteration is the bulk of it and is not
  fully predictable; the `eliminatesPaths` validator exists because prompt
  quality alone will not hold this property.
- Phase 15 is the most visible but the most predictable, since it follows
  existing `features/ideas/` patterns closely.
- Phase 16 is small and can be compressed if the schedule slips, at the cost
  of shipping an LLM agent that writes user documents with no test coverage.
  That is the one trade-off not recommended.
