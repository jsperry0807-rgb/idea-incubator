# Tech Stack

## Core Stack

| Layer        | Technology                         | Notes                                                                  |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| Frontend     | React 19 + Vite 8                  | Existing SPA; no framework change                                      |
| Routing      | React Router 7                     | Interview panel mounts inside existing IdeaDetailPage                  |
| Server state | TanStack Query 5                   | `usePlanningSection` pattern reused for interview state                |
| HTTP         | Axios                              | Existing instance; needs a separate streaming path (see Notes)         |
| Backend      | Express 5                          | REST API; no framework change                                          |
| Validation   | Zod 4                              | Interview contracts live in `packages/shared`, mirroring `planning.ts` |
| Database     | PostgreSQL                         | One new `Interview` table                                              |
| ORM          | Prisma 7 (pg adapter)              | Migration only; no existing model changes beyond the enum              |
| Auth         | `jose` JWT + `assertIdeaOwnership` | No new auth surface                                                    |
| Storage      | `LocalFileStore` (existing)        | Plan output reuses the planning write path                             |
| i18n         | i18next (en / es / fr)             | All three locales required                                             |
| UI           | `@repo/ui`                         | Reuse `Card`, `Button`, `Badge`, `Spinner`, `Modal`                    |

## New Additions

| Technology                             | Why                                                                                           | Risk                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Provider LLM client (own thin wrapper) | Interview needs structured JSON _and_ prose from one call; no existing dependency covers this | Low — internal interface, provider swappable behind `LlmClient` |
| `vitest`                               | Zero tests exist today; the reducer is pure and is the highest-value first test target        | Low — dev dependency only                                       |
| `msw`                                  | Mock LLM HTTP in integration tests without a real key                                         | Low — dev dependency only                                       |
| `zod-to-json-schema` (or hand-rolled)  | Sending Zod contracts to the provider for structured output                                   | Low                                                             |

**Deliberately not added:**

| Not adding               | Why                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| LangGraph / LangChain    | ~6-node machine; durable state is one Postgres row. See `architecture.md`                                                         |
| `brainstorm-mcp`         | stdio MCP server for coding agents, not a library or HTTP API. Its synthesis _prompt_ is ported instead                           |
| `chatfield` (Python pkg) | Requires a schema known up front, which defeats dynamic decision discovery. Tail-only, flag-gated, deferred past the core feature |

## Database Choice

One new `Interview` table with a `Json` state column, on the existing
PostgreSQL instance via Prisma. `Json` is correct here specifically because the
reducer performs a single atomic read-modify-write of the whole interview:
normalized `Question`/`Answer` rows would add partial-update failure modes for
no benefit while the state shape is still evolving. Postgres `Jsonb` also
gives indexed access to the state blob if cross-idea analytics of decision
points becomes a question later.

The relation cascades from `Idea`, matching the existing `Task`, `Comment`, and
`Share` patterns, so deleting an idea removes its interview with no extra
cleanup.

## Project Type Enum Change

`IdeaProjectType` widens from `SOFTWARE | GAME | WEBSITE` to add `SAAS` and
`PHYSICAL`, and `updateIdeaSchema` gains a `projectType` field.

Currently the type is locked at creation — `createIdeaSchema` accepts it,
`updateIdeaSchema` (`packages/shared/src/schemas/idea.ts:31`) does not, and
there is no reclassification path. A user who mis-picks cannot correct it. That
is tolerable for scaffolding but not tolerable for AI-generated planning, where
the wrong type produces the wrong document set entirely.

`SAAS` maps to the existing `SOFTWARE` section set. `PHYSICAL` needs a new
section set covering supply chain, fulfilment, and unit economics.

## Services & Integrations

- **LLM provider** — one external HTTP dependency, configured through the
  existing `apps/server/src/config/env.ts` Zod pattern. Key never reaches the
  client.
- **No other new integrations.** Mail (already added for password reset),
  storage, and auth are all reused as-is.
