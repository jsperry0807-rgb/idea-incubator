# Audit Remediation Roadmap

Source: whole-monorepo audit (backend / client / toolchain+shared+UI), 42 findings.
Product roadmap lives in `roadmap.md`; this file is the quality and correctness queue.

Phases are ordered so that each one leaves the repo green and independently shippable.

---

## Phase 1 — Broken or dead today

**Goal:** restore functionality that is currently broken or unenforced. Small, mechanical, independently verifiable.

- [x] **1.1 Keyboard drag-and-drop never works.** `pointerWithin` yields no collisions for `KeyboardSensor`, so `over` is always undefined and every keyboard drag silently no-ops.
  - `apps/client/src/features/ideas/components/TaskBoard.tsx:91-94,204-206`
  - `apps/client/src/features/ideas/components/KanbanBoard.tsx:39-42,113-115`
  - Fix: sensor-aware collision detection (pointer-only when pointer coordinates exist, rect-based otherwise) plus `sortableKeyboardCoordinates` on the sortable board.
- [x] **1.2 Query cache survives logout / session expiry / account deletion.** Previous user's ideas, dashboard and notifications render for up to the 30s `staleTime` after a different user logs in.
  - `apps/client/src/main.tsx:24-30`, `apps/client/src/features/auth/context/AuthProvider.tsx:40-47,67-74,81-85`
  - Fix: `queryClient.clear()` on all three paths. Consider user-scoping query keys.
  - Done: `clearSession()` (token + `queryClient.clear()` + `setUser(null)`) now backs logout, `deleteAccount`, and the `auth:unauthorized` listener. `startSession()` clears on `login`/`register` when the incoming user id differs from the current one, so switching accounts cannot inherit a cache even if logout was skipped. `clear()` also empties the mutation cache and cancels in-flight queries, so a late response cannot repopulate an entry.
- [x] **1.3 `Modal` steals focus on every parent re-render.** All call sites pass inline arrows, so the effect re-runs and pulls focus back to the panel mid-typing — breaks the markdown-import dialog.
  - `packages/ui/src/Modal.tsx`
  - Done: `onClose` is held in a ref updated by its own effect, so `handleKeyDown` has an empty dep list and the open/close effect depends only on `[open, handleKeyDown]`. Added a Tab/Shift+Tab focus trap with an empty-container fallback to the panel, restore of the _previous_ `document.body.style.overflow`, and `useId()`-based `aria-labelledby`. Titleless dialogs now take an explicit `ariaLabel` instead of reusing the close-button label.
- [x] **1.4 Interview can deadlock permanently.** `onSynthesized` parks phase in `SYNTHESIZE` without setting `stuck`, but both exits gate on `state.stuck?.pointId`, so manual synthesis leaves the interview unable to defer (409) with a mislabeled phase.
  - `apps/server/src/interview/reducer.ts:290-293`, `apps/server/src/services/interview.service.ts:247,293-320`
  - Done: `onSynthesized` now sets `stuck` from `forPointId`, reusing an existing marker for the same point so skip-driven synthesis is unchanged. Both exits (answer, defer) release the stuck point. Covered in `reducer.test.ts` under "manual synthesis", including the answer path through `REEVALUATED`.
- [x] **1.5 Synthesis rate limit bypassed ~6x.** The 10/hr budget guards only `POST /interview/synthesis`; skip-driven synthesis runs under the 60/hr limiter and `synthesize()` has no phase guard.
  - `apps/server/src/middleware/rateLimit.ts:32-35`, `apps/server/src/interview/graph.ts:139-158`
  - Done: replaced the route middleware with `chargeSynthesis(userId)`, called from the loop's `synthesize` directive (via `budgetOwner`, threaded through `pump`) and from `synthesizeInterview`, which bypasses the loop — exactly one charge per synthesis. Added a phase guard rejecting `READY`/`DONE` and points that are not open. `turn` now increments on skip and defer, and `onSkipped` checks the cap itself since it bypasses `afterResolution` (a skip-only interview previously ran past `MAX_TURNS` unbounded). `rateLimit.test.ts` plus two loop-level tests; the budget test was confirmed to fail when the charge is removed.
- [x] **1.6 Twelve dead ESLint rules.** Every pattern targets `src/feature/*` but the directory is `src/features`, so the cross-feature import ban, all naming rules, and the "only `types.ts` at feature root" rule enforce nothing.
  - `apps/client/eslint.config.js:59,115-120,142,153,159`, `apps/client/eslint.config.js:166`
  - Done, but not the way the fix line predicted. Three separate defects were stacked:
    1. **Wrong directory** — `src/feature/*` vs `src/features`.
    2. **Wrong match mode** — element descriptors default to `match: folder`, so `src/features/*` types the feature _folder_ but leaves imported _files_ untyped, and a `to: { type: 'feature' }` selector never matches. Changed to `src/features/**`, which types feature files.
    3. **Unmatchable policy** — the cross-feature ban compared the importing feature's name against the imported one via `captured: { featureName: '!{{from.featureName}}' }`. That cross-element capture only existed in the removed v5 template syntax; v7 has no equivalent, and enabling `boundaries/legacy-templates` changes nothing. That half of the rule cannot be expressed and was dropped rather than left silently dead.
  - The enforceable half — shared components must not import features — now runs and was verified to fire. `RootLayout` was the one offender and legitimately so: it is the composition root. Rather than special-case it, it moved to `src/app/RootLayout.tsx` (new `@app` alias in `tsconfig.app.json` and `vite.config.ts`), so everything under `src/components` is now provably feature-agnostic.
  - Naming rules that are now live and verified by probe: feature-root `SNAKE_CASE`, `hooks/*` `CAMEL_CASE`, `components/**` `PASCAL_CASE`. Two real violations found and fixed: `features/{ideas,dashboard}/components/skeletons.tsx` → `IdeaSkeletons.tsx` / `DashboardSkeletons.tsx` (9 import sites updated).
  - `src/stores` was missing from `boundaries/elements` entirely; added. Note the folder-naming rules can only ever report folders that contain a linted file, so empty directories are never flagged.
- [x] **1.7 CI never runs tests.** `typecheck → format:check → lint → build`, but the server has six test files and a working `test` script.
  - `.github/workflows/ci.yml`, `apps/server/package.json`
  - Done: added a root `test` script (`pnpm -r --if-present test`) and a Test step to CI after lint. `pnpm test` runs green locally at 87 tests.
- [x] **1.8 Global slug collision returns 500.** Slug is globally `@unique` but the collision probe is `userId`-scoped, so two users with the same title hit P2002.
  - `apps/server/prisma/schema.prisma:90`, `apps/server/src/services/idea.service.ts:285-292`
  - Done, choosing `@@unique([userId, slug])`. The slug is a display identifier — nothing resolves an idea by it, and it appears in no route on either side — so per-user uniqueness is the correct model and it matches the probe that already existed. Migration `20261002120000_idea_slug_per_user` drops `ideas_slug_key` and adds `ideas_userId_slug_key`; safe for existing rows, since anything globally unique is already unique per user.
  - Also closed the race the probe itself leaves open: probe-then-write is not atomic, so two concurrent creates can still pick the same slug. `withSlugCollisionRetry` retries on `P2002` (re-running the probe picks up the winner's row) and converts exhausted retries into a `ConflictError` instead of a 500. Wired into both call sites, `createIdea` and `updateIdea`.
  - Added `apps/server/src/lib/slug.test.ts` for the slug primitives.
- [x] **1.9 `?unread=false` returns unread-only.** `z.coerce.boolean()` makes `Boolean("false")` true.
  - `packages/shared/src/schemas/notification.ts:5`
  - Done: `z.stringbool()`, which parses explicit boolean spellings and rejects nonsense instead of coercing. Covered in `apps/server/src/middleware/notificationQuery.test.ts` (`@repo/shared` has no test runner).

**Gate:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm format:check`, `pnpm build`, `pnpm test` all pass; keyboard drag verified manually on both boards.

---

## Phase 2 — Correctness, security, performance

**Goal:** the correctness and security findings. Grouped because several share a fix site.

### Server robustness

- [x] **2.1 No LLM request timeout.** `fetch` had no `AbortSignal`, so a hung provider pinned the handler and a pool slot forever.
  - `apps/server/src/services/llm.service.ts`, `apps/server/src/interview/loop.ts`
  - Done: `AbortSignal.timeout(LLM_REQUEST_TIMEOUT_MS)` (30s, overridable per call) on every provider request. Step-bounding alone was not enough — 100 steps × a 30s timeout is still an hour — so `runLoop` also carries a `MAX_LOOP_DURATION_MS` (120s) wall-clock deadline checked before each model call, raising a new retryable `LlmTimeoutError` (503).
- [x] **2.2 Interview state read-modify-write with no version guard.** Concurrent answers overwrote each other after both paid for a model call.
  - `apps/server/prisma/schema.prisma`, `apps/server/src/services/interview.service.ts`
  - Done: added `Interview.version` (migration `20261003120000_interview_version`, defaulting to 0 so existing rows need no backfill). `persist` now takes the version the caller read and does a predicate `updateMany` with `version: { increment: 1 }`; `count === 0` becomes a 409 telling the client to reload. Wired through all four mutating paths (answer, skip, defer, synthesize). `loadInterview` returns `{id, version, state}` so the version travels with the state it belongs to instead of being re-read.
- [x] **2.3 Body-parser errors surfaced as 500.** Malformed JSON and >1MB bodies returned 500; no `res.headersSent` guard.
  - `apps/server/src/middleware/errorHandler.ts`
  - Done: `asClientError` maps `entity.parse.failed` → 400 `BAD_REQUEST` and `entity.too.large`/413 → `PAYLOAD_TOO_LARGE`. The `headersSent` guard comes first, handing back to express to tear down the connection rather than throwing `ERR_HTTP_HEADERS_SENT` on top of the original failure.
- [x] **2.4 Redundant queries on hot paths.** The idea row was fetched twice per interview request; `persist` re-read the full row including the `state` JSON just for an id.
  - `apps/server/src/services/interview.service.ts`, `apps/server/src/services/idea.service.ts`
  - Done: added `loadOwnedIdea`, which returns the ownership check and the row in one query; `assertIdeaOwnership` now wraps it, so the two cannot diverge. `persist` no longer re-reads — it takes the interview id it already has. Also drops a query on the resume path. Left `ensureDefaultTags` alone: it is load-bearing for OAuth users, who have no `register` call to have created their tags.
- [x] **2.5 Unbounded `findMany`.** `getActivity` loaded three whole tables to return 10 rows; notifications and comments had no bound at all.
  - `apps/server/src/services/dashboard.service.ts`, `notification.service.ts`, `comment.service.ts`
  - Done: `getActivity` caps each source at the same `ACTIVITY_LIMIT` as the final result — any row that can reach the top 10 is necessarily among its own source's newest — and orders ideas explicitly, which they previously were not. Notifications gained `page`/`pageSize` (default 20, max 100) via the shared query schema. Comments capped at 100. Noted rather than deferred: `listTasks` and `listShares` are unbounded too, but both are scoped to a single idea, so their size is bounded by that idea.
- [x] **2.6 Answer discarded if the pump throws.** `persist` never ran, so a provider timeout silently lost everything the user typed.
  - `apps/server/src/services/interview.service.ts`
  - Done: `persistAnswerOnly` records the answer as a decision (point stays open, phase stays `ASK`) before the failure propagates, so a retry resumes. `toRetryableModelError` maps timeouts, aborts, and connection failures to a 503 `LLM_UNAVAILABLE` and passes `AppError`s (budget, validation) through untouched.
- [x] **2.7 `optionId` was not validated.** A client could replay an option that was never offered and have it persisted as fact.
  - `apps/server/src/services/interview.service.ts`
  - Done: when `optionId` is present it must match one of the current question's options, else a 422. `pointId` was already checked; both now run before anything is written.
- [x] **2.8 Prompt injection via interpolated user text.** Raw `freeText`/`value`/idea text went in undelimited with no untrusted-data instruction.
  - `apps/server/src/interview/prompts/untrusted.ts` (new), all four prompt builders
  - Done: every user-authored value is passed through `fence()`, which strips control characters (zero-width, bidi overrides, line separators — text a reviewer cannot see but the model can), truncates, and wraps in `<<<UNTRUSTED_* >>>`. Angled brackets are stripped from the value so a user cannot close the fence and escape into the instruction region. Every builder's system prompt now carries `UNTRUSTED_DATA_RULE`. `synthesis.ts` was affected too and is included. 13 tests in `untrusted.test.ts` cover the fence-escape and hidden-character cases.
- [x] **2.9 Unbounded `answer.value`.** No `.max()`, and only one of the three builders truncated, so prompts grew across 40 turns.
  - `packages/shared/src/schemas/interview.ts`, `apps/server/src/interview/prompts/untrusted.ts`
  - Done: `value` capped at 500. One `formatDecisionLog` now serves all four builders, so the log cannot grow without bound regardless of which one renders it.

### Server security

- [x] **2.10 Share was a user-enumeration oracle.** Share 404'd for unknown emails while `forgotPassword` returned `{sent:true}`.
  - `apps/server/src/services/share.service.ts`, `packages/shared/src/entities.ts`, `apps/client/.../InviteForm.tsx`
  - Done, choosing the uniform-response option over opaque invite tokens: an unknown address now returns the same 200 with `pending: true` and no identity, instead of a distinguishable 404. The response carries no user id, name, or email, so it cannot reveal whether the address is registered; the owner sees no new entry in the access list. Removed the client's now-dead 404 branch. An opaque invite token remains the stronger fix (it also works for unregistered addresses) and is left as future work.
- [x] **2.11 `trust proxy` was never set.** Behind a proxy all users shared one 100/15min bucket and v8 raised `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.
  - `apps/server/src/index.ts`
  - Done: `app.set('trust proxy', 1)` in production only. Exactly one hop, not `true` — trusting the whole chain would let a client spoof `X-Forwarded-For` into a fresh bucket. The 100/15min global ceiling is unchanged; it was correct, just applied to the wrong key. Still in-memory, so the deferred "shared store" item applies when there is more than one replica.
- [x] **2.12 Password resets never sent and leaked the token.** Production returned success while logging the live reset URL and recipient.
  - `apps/server/src/services/mailer.service.ts`, `apps/server/src/index.ts`, `apps/server/src/config/env.ts`
  - Done: `assertMailerConfigured()` runs at startup and throws in production without `SMTP_HOST`, so the misconfiguration surfaces at deploy time rather than when a user needs their password back. The production branch that logged the live 60-minute URL is gone. Added the `SMTP_*` keys. Note: no transport is implemented yet, so a production deploy with `SMTP_HOST` set now fails loudly on first use instead of silently not sending — the alternative was silently dropping mail.
- [x] **2.13 Weak secret validation.** Secrets were `min(1)` and could be equal, in which case a refresh token worked as a bearer credential.
  - `apps/server/src/config/env.ts`
  - Done: `min(32)` on both, plus a `.refine` rejecting identical secrets with the reason stated. A `.refine` rather than `superRefine` because the check is between two top-level fields and needs no per-field path beyond the one given.
- [x] **2.14 Account deletion left files on disk.** Cascades removed DB rows but never called `storage.deleteIdeaFolder`.
  - `apps/server/src/services/auth.service.ts`
  - Done: idea ids and project types are collected before the delete (the userId is needed afterwards), then each folder is removed. Failures are swallowed — the account is already gone, and failing the request afterwards would tell the user deletion failed when it succeeded.
- [x] **2.15 Four check-then-act races.** Email unique, tag name unique, `max(sortOrder)`, ownership-then-update — all bypassed their own `ConflictError` and returned raw 500s.
  - `apps/server/src/lib/prismaErrors.ts` (new), `auth.service.ts`, `tag.service.ts`, `task.service.ts`, `idea.service.ts`
  - Done: added `withPrismaErrors`/`translatePrismaError`, centralising P2002 → 409 and P2025 → 404, and rethrowing anything unrecognised unchanged. Dropped the email and tag-name pre-checks so the unique index decides; kept the better message by catching the translated `ConflictError` and re-wrapping with the domain text. `max(sortOrder)` + insert now run in one interactive transaction, so concurrent creates cannot both read the same maximum. Ownership-then-update/delete paths are wrapped so the loser's P2025 is a 404, not a 500.
- [x] **2.16 Duplicated access check.** `createComment` hand-rolled a copy of `assertIdeaAccess` that already differed from the helper its siblings used.
  - `apps/server/src/services/comment.service.ts`
  - Done: calls the shared `assertIdeaAccess`, then loads the owner row separately for the notification. The two access paths can no longer disagree.

### Client correctness

- [x] **2.17 Four queries dropped the abort signal.** `useIdea`, `useWireframes` ×2, and `useTags` did not forward `signal` while ten others did, so idea-to-idea navigation left the previous request in flight.
  - `apps/client/src/features/ideas/hooks/`, `features/tags/hooks/`, and their `api/` modules
  - Done: the four `queryFn`s take `{ signal }` and forward it; `getIdea`, `listWireframes`, `getWireframe`, and `getTags` accept and pass an optional `AbortSignal`, matching the existing `getIdeas` signature.
- [x] **2.18 Optimistic writes raced `cancelQueries`.** An un-awaited `cancelQueries` let a resolving `getPipeline` response resurrect a deleted or moved card.
  - `apps/client/src/features/ideas/hooks/useDeleteIdea.ts`, `useUpdateIdeaStatus.ts`
  - Done: `onMutate` is `async` and awaits `cancelQueries` **before** the optimistic write. The original also had the ordering wrong independent of the await — it wrote first and cancelled after, so an already-in-flight response could overwrite the optimistic state even when awaited. Matches `useUpdateTask`.

**Gate:** full CI green including the test step from 1.7.

---

## Phase 3 — Accessibility

**Goal:** the a11y findings. Independent of the above; can ship in any order.

- [x] **3.1 `IdeaFilters` promises navigation that doesn't exist.** `role="tablist"`/`role="tab"`/`aria-selected` with no `aria-controls`, no `tabpanel`, no roving `tabIndex`, no arrow keys.
  - Done: these filter one list rather than switching panels, so they are now a `role="group"` of `aria-pressed` toggle buttons — which is what the widget actually is, and needs no roving `tabIndex` or arrow-key handling. Renamed `STATUS_TABS` → `STATUS_FILTERS` and narrowed `IdeaFilters.status` from `string` to `IdeaStatus`, since only the seven enumerated values are ever selectable; `useIdeas` keys its cache on the whole filter object so the narrower type is free.
- [x] **3.2 Form error text isn't announced.** Bare `<span>`; no `aria-invalid`/`aria-describedby`; `id ?? props.name` can leave a label unassociated.
  - Done: `Input`/`Textarea` derive the id as `id ?? name ?? useId()`, so the `<label htmlFor>` always resolves. Errors render `role="alert"`, set `aria-invalid`, and are wired through a deterministic `${inputId}-error` in `aria-describedby` (falling back to any caller-supplied `aria-describedby`).
- [ ] **3.3 Global shortcuts stay live while dialogs are open.** `?`/`n`/`/` can stack a second `z-50` modal or navigate away with unsaved input; scroll lock restores `''` instead of the prior value. `apps/client/src/components/layout/RootLayout.tsx:225`, `shortcuts/GlobalShortcuts.tsx:19-53`.
- [x] **3.4 Nested interactive content.** `<Link><Button/></Link>` renders an invalid `<a><button>` with an ambiguous accessible name.
  - Done: `Button` gained an `asChild` prop backed by a small slot merge (no new dependency), composing `className`, `style`, and `on*` handlers while leaving `href`/`to` with the child. `NotFoundPage` and `IdeasPage` now render a single interactive element.
- [x] **3.5 Toaster live regions.** Nested `aria-live` + `role="status"`; errors announced politely.
  - Done: the portalled wrapper only positions; the toasts are split across two sibling live regions — `aria-live="polite"` for success/info and `aria-live="assertive" aria-atomic="true"` for errors — with no `role="status"` per toast. This avoids both double announcements and a polite parent silently downgrading `role="alert"` children.
- [x] **3.6 `Card interactive` is a mouse-only affordance.** `cursor-pointer` on a plain `<div>` with no role, `tabIndex`, or key handler.
  - Done: when `interactive` and `onClick` are both set, the card renders `role="button"`, `tabIndex={0}`, a focus-visible ring, and Enter/Space activation that calls the caller's own `onKeyDown` first and honours `defaultPrevented`. Styling-only `interactive` (nested `<Link>`/`<button>` call sites) is unchanged and adds no extra tab stop.
- [x] **3.7 Untranslated user-facing strings.** `Modal.tsx`, `Toaster.tsx`, `Spinner.tsx`, `StatusBadge.tsx` shipped raw enum text and English to es/fr users despite existing keys.
  - Done: `Modal` takes `closeLabel`, `Toaster` takes `dismissLabel`, `Spinner` takes `label`; all call sites pass `t(...)`. Added `app.close`/`app.dismiss` to all three locales. `StatusBadge` now renders `t(\`ideas.status.${status}\`)`instead of the raw enum. Also fixed`NotFoundPage`, which had hardcoded English and no `useTranslation` at all.

---

## Phase 4 — Toolchain coherence

**Goal:** make the toolchain actually enforce what it claims. Largest diff, so it lands after the behaviour fixes.

- [ ] **4.1 Client is not strict.** Both client tsconfigs omit `extends`, so `strict` and `noUncheckedIndexedAccess` are off for the entire SPA. `apps/client/tsconfig.app.json`, `tsconfig.node.json` — add `extends` to the shared base, then fix fallout. Largest single quality gap.
- [ ] **4.2 Prettier conflict suppression never applies.** `eslint-config-prettier` is only in the root config, but root `lint` is `pnpm -r lint`, so no real lint run has it. `eslint.config.mjs:2,8-9` — append it inside `packages/config/eslint.config.js` so every consumer gets it.
- [ ] **4.3 Client ESLint has drifted from the shared factory.** `apps/client/eslint.config.js` inlines a copy of the base rules instead of importing `baseConfig`, and has already lost `eqeqeq`, the `_` ignore pattern, and `build`/`coverage` ignores.
- [ ] **4.4 Root config files are unlinted.** `pnpm -r` excludes the workspace root and `packages/config` has no scripts, so `eslint.config.mjs` and `packages/config/eslint.config.js` are never checked.
- [ ] **4.5 Fresh clones cannot typecheck.** `apps/server/src/generated/prisma/**` is gitignored and imported at type level, but there is no root `postinstall`. Add one.
- [ ] **4.6 Node version drifts across four sources.** README says 20+, CI pins unpinned 22, `@types/node` is 24, no `engines` or `.nvmrc`. Align all four.
- [ ] **4.7 Server root configs aren't typechecked.** `apps/server/prisma7.config.ts` and `vitest.config.ts` sit outside `include: ["src"]`. Contrast: `apps/client/tsconfig.node.json` does cover `vite.config.ts`.

---

## Phase 5 — Single-sourcing and dependency hygiene

**Goal:** remove duplicate sources of truth and dead weight. Mechanical.

- [ ] **5.1 `PlanningSection` names declared four times.** `packages/shared/src/enums.ts`, `apps/server/src/lib/planningTemplates.ts:9-23` (redeclares the union despite already importing shared), the client locale, `apps/server/src/interview/state.ts:56`. A missed edit in `planningTemplates.ts` is not a compile error — templates silently stop covering a section.
- [ ] **5.2 Shared `Interview` is untyped.** `phase: string; state: unknown` while the server has precise types that aren't exported. `packages/shared/src/entities.ts:145-146` — move `InterviewPhase` to shared, export `InterviewState`.
- [ ] **5.3 `ideaListQuerySchema.status` is a free string.** Not `statusEnum`, while the adjacent `priority` correctly is. `packages/shared/src/schemas/idea.ts:41`.
- [ ] **5.4 Eleven dead exports in `@repo/shared`.** Including `pageSchema`/`pageSizeSchema`, which duplicate _conflicting_ inline validation in `idea.ts:38-39` — two pagination sources of truth, one unused.
- [ ] **5.5 Dependency cleanup.** Drop `@types/bcryptjs` (deprecated stub), the redundant root `@typescript-eslint/*` (lockfile resolves 8.71 vs 8.68 across two trees), and `@repo/config` from UI's `dependencies` (should be `devDependencies`).
  - Partially done: `@repo/config` moved to `devDependencies` in `packages/ui/package.json`; `sideEffects: false` added to match the leaf package's shape. The `@types/bcryptjs` and root `@typescript-eslint/*` removals are still pending.
- [x] **5.6 UI package hardcodes English strings.** Covered in 3.7.
- [ ] **5.7 Root package is named `"copy"`.** Cosmetic; fix while touching the manifest.

---

## Phase 6 — Repo hygiene

- [ ] **6.1 README inaccuracies.** `https://<your-client-url>` placeholder, screenshots pointing at a non-existent directory, roadmap link to a different project, "lints only the client", Node version, and an env table missing `CLIENT_URL`, `RESET_TOKEN_TTL_MINUTES` and all five `LLM_*`.
- [ ] **6.2 Server `dist` is not runnable and never consumed.** Keeps bare `@repo/shared` specifiers pointing at `.ts`; `start` uses `tsx` on source. A false-green build gate.
  - **Needs a decision:** is the server ever meant to run from `dist`? If no, delete the build step rather than making it work — that removes CI time instead of adding it.
- [ ] **6.3 Dead `@feature` Vite alias.** `apps/client/vite.config.ts:18` — zero imports use it; invisible to the typechecker.
- [ ] **6.4 Two tracked `skills-lock.json` files** pointing at gitignored `.opencode/skills` directories.
- [ ] **6.5 No `.editorconfig`**, and `.vscode/settings.json` is gitignored so no contributor gets the monorepo ESLint config.
- [ ] **6.6 `.prettierignore` misses generated Prisma output** and `.gitignore` misses `coverage`.
- [ ] **6.7 Template SEO metadata ships to production.** `apps/client/index.html:11-45` — `Your Name or Company`, `https://www.example.com/` canonical.
- [ ] **6.8 Two unused locales in the entry chunk.** All three dictionaries are statically imported; es/fr strings are confirmed present in the 421 KB entry bundle. Load non-detected locales dynamically.
- [ ] **6.9 Dead code in client and UI.** `ThemeToggle.tsx`, `LanguageSwitcher.tsx`, the entire `modal` store slice, `dismissToast`/`useToasts` public exports, duplicated `emptyPipeline()` and password-error mapping.
  - Partially done: `dismissToast`/`useToasts` removed from `packages/ui/src/index.ts` — they are `Toaster`'s private binding to the store, not public API, and had no consumers outside the package.
- [x] **6.10 Inconsistent UI props API.** `ProgressBar`/`EmptyState`/`Skeleton` accept only a hand-picked subset while `Button`/`Input`/`Textarea`/`Card` forward `...props`; no primitive accepts a `ref`.
  - Done: `ProgressBar`, `EmptyState`, and `Skeleton` now extend their element's `HTMLAttributes` and spread the rest. `Button`, `Input`, `Textarea` declare an explicit `ref` prop (React 19 passes it as a normal prop; it lives in `ClassAttributes`, not the `*HTMLAttributes` interfaces). `Card` forwards `onClick`/`onKeyDown` explicitly because it now interprets them.

---

## Deferred

| Item                             | Trigger to revisit                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bundle split beyond locales      | Entry chunk exceeds a budget you care about                                                                                                                                                                                                            |
| `Card interactive` redesign      | A component actually needs to render as a button/link. Interim fix (3.6) makes the card itself operable only when it owns `onClick`; the three current call sites wrap a nested `<Link>`/`<button>` instead and are better solved by `Button asChild`. |
| Shared store (`pnpm-lock` store) | Running more than one server replica, or horizontal scaling                                                                                                                                                                                            |
| Client test suite                | Server coverage in CI goes green (1.7) — this is the right order                                                                                                                                                                                       |
