# Testing

## Current State

There are no tests in this repository. No test framework, no test script, no
test files. `.github/workflows/ci.yml` runs install → `prisma generate` →
`pnpm typecheck` → `pnpm lint` → `pnpm build`, and nothing exercises the API.

An LLM agent that writes to user documents is the highest-risk thing this
codebase could add without a test suite. The reducer is pure by design
precisely so it can be tested cheaply, with no network and no model mocks.
That property is the main reason Phase 1 includes Vitest rather than deferring
it to polish.

## Also Fixing

Root `lint` is hardcoded to `pnpm --filter @repo/client lint`, so the server and
shared packages are never linted. The CI matrix runs `pnpm lint` from each
working directory but the root script still resolves to the client-only
command. Make it recursive before the interview code lands, otherwise the
largest new surface in the project is the only one not linted.

## Layer 1 — Reducer Unit Tests (highest value, zero network)

The reducer does no I/O, so these run in milliseconds with no fixtures and no
mocks. They are where the branching contract is actually enforced.

```
interview/reducer.test.ts
```

| Test                                                                           | Asserts                                        |
| ------------------------------------------------------------------------------ | ---------------------------------------------- |
| `CLASSIFIED` seeds a P0/P1 frontier                                            | Initial open points populated, phase → `ASK`   |
| Highest priority unresolved point is selected first                            | P0 before P1 regardless of insertion order     |
| A point in `asked[]` is never re-asked                                         | Re-ask suppression is structural               |
| Answering `hybrid` to `core-loop` opens `upgrade-cadence` and `prestige-layer` | The core branch behavior                       |
| `pure-incremental` does **not** open those points                              | Branches are genuinely divergent, not cosmetic |
| An answer that invalidates an open point closes it                             | Re-evaluation both closes and opens            |
| `attempts` reaching 2 emits a `SYNTHESIZE` directive                           | Stuck threshold fires at the right boundary    |
| Deferring removes the point from the frontier and records an assumption        | Defer is not the same as resolve               |
| All P0 resolved + coverage met → `READY`                                       | Termination is reachable                       |
| Turn cap emits a terminating directive                                         | Runaway guard                                  |
| `eliminatesPaths: []` is rejected                                              | The static-template invariant holds            |

## Layer 2 — Golden Traces (the executable behavior spec)

Three seed ideas in `apps/server/src/interview/fixtures/`:

| Fixture            | Exercises                                                     |
| ------------------ | ------------------------------------------------------------- |
| `clicker-game`     | GAME domain; the worked branch from `architecture.md`         |
| `saas-tool`        | SOFTWARE/SAAS; different frontier, proves domain sensitivity  |
| `physical-product` | PHYSICAL; a third section set, proves the enum change is real |

**Assert branch structure, never wording.** Exact question prose is
non-deterministic across model versions and would make the suite fail on
unrelated changes. What must be stable:

- Which decision points appear, in priority order
- Which points an answer opens and closes
- When `SYNTHESIZE` fires
- Which planning sections a decision grounds

Two tiers:

- **Committed** — hand-authored expectations, run in CI with no API key. This
  is the regression net. It encodes our _asserted_ branch structure, so it is
  a weaker guarantee than observed behavior, but it catches accidental
  regressions in prompt or reducer changes.
- **Regenerated** — real transcripts produced with a key present, reviewed and
  committed deliberately when prompts change. This is where we see actual
  behavior. Run via a script, not CI, since it costs money and is
  non-deterministic.

Running the same three seeds across both tiers and diffing is how prompt
changes get reviewed before shipping.

## Layer 3 — Service Integration (MSW)

`msw` intercepts LLM HTTP so integration tests run without a key.

- Directive resolution calls the right prompt for each directive type
- Structured-output validation failure triggers exactly one retry
- A third failure surfaces a clear error rather than a broken panel
- `assertIdeaOwnership` blocks `EDIT` and `VIEW` collaborators on every route
- Rate limits return a helpful message, not a bare 429
- Locale is passed into every prompt

## Layer 4 — Plan Writer

- Generates a section per `sectionsForType(projectType).created` — asserts the
  count per type
- Writes **11 markdown files plus `Task` rows**; there is no `tasks` planning
  section, so a 12th file is a bug
- Every section carries `groundedBy[]` and marks inferred content
- `POST /interview/plan` writes nothing
- `PUT /interview/plan` requires `confirm: true`
- Existing hand-edited content is preserved in the diff
- `Task` rows group correctly by milestone

## Layer 5 — Client

- Panel mounts and unmounts cleanly on `IdeaDetailPage`
- Option table is fully keyboard navigable
- Pending states render per phase
- Planning queries invalidate after a plan is applied
- i18n keys present in `en`, `es`, `fr` with no fallback leakage

## Commands

```bash
pnpm --filter @repo/server test          # new
pnpm test                                # new, recursive once added
pnpm typecheck
pnpm lint                                # after making recursive
pnpm build
```

## Fixture Regeneration

A script (not a CI job) regenerates the observed-tier transcripts:

```bash
pnpm --filter @repo/server interview:regenerate-fixtures
```

Requires a provider key. Output is reviewed as a diff, never auto-committed —
a silent regeneration would let prompt regressions through unnoticed, which is
the exact failure mode the golden tier exists to prevent.
