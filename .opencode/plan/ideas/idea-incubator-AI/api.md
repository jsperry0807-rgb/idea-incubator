# API

All routes are mounted under `/ideas/:id` with `mergeParams: true`, mirroring
`apps/server/src/routes/planning.routes.ts`. Responses use the existing
`{ data }` envelope; errors use `{ error: { code, message, details } }`.

## Permissions

Every route uses `authenticate` + `assertIdeaOwnership`, matching planning and
wireframes. Interview state can contain a user's raw idea text, so shared
(`EDIT`/`VIEW`) collaborators do **not** get read access to it. Owner-only, no
exceptions.

## Rate Limiting

Each turn is a paid LLM call, so the global limiter is not enough.

| Scope         | Limit           | Rationale                                                  |
| ------------- | --------------- | ---------------------------------------------------------- |
| Per interview | 40 turns        | Hard termination cap; also a runaway guard                 |
| Per user      | 60 turns / hour | Stops a loop of refresh-and-retry from draining the budget |
| Synthesis     | 10 / hour       | The most expensive call in the system                      |

A user who exhausts a limit gets a clear, non-error message pointing at the
decision log, not a generic 429 wall.

## Routes

### `POST /ideas/:id/interview`

Start (or resume) an interview. Idempotent — if one exists in a non-`DONE`
phase, returns the current state and pending question rather than starting
over.

Request: none (description comes from the idea).

Response: `InterviewState` plus the resolved directives as concrete payloads —
i.e. the first question, already generated. The client never has to call twice
to see the opening question.

### `GET /ideas/:id/interview`

Current state. Includes `decisions`, the `open` frontier, `asked[]`, the
transcript so far, and coverage. Powers the decision log and lets the panel
rehydrate after a refresh.

### `POST /ideas/:id/interview/answer`

Submit one answer and advance. This is the hot path.

Request:

```json
{
  "pointId": "core-loop",
  "optionId": "hybrid",
  "value": "hybrid",
  "freeText": null
}
```

`optionId` is `"free-text"` when the user types an answer instead of choosing.
`value` always carries the resolved decision, so the plan writer never depends
on option ids surviving a prompt change.

Response: the next `Question`, or a `Synthesis` if this answer triggered stuck
detection, or `{ phase: "READY" }` when the interview completes.

The single-response shape is deliberate: a turn is a synchronous
reduce-then-render cycle, and returning the next question in the same payload
is what makes the panel feel like a conversation rather than a form POST.

### `POST /ideas/:id/interview/synthesis`

Force a stuck synthesis for a specific point, bypassing the
`attempts >= 2` trigger. This is the "I'm stuck, help me decide" button.

Request: `{ "pointId": "core-loop" }`

Response: `Synthesis { recommendation, keyTradeoffs[], strongestDisagreement }`

### `POST /ideas/:id/interview/defer`

Mark a point deferred. The decision is recorded, the point is removed from the
frontier, and the outcome is written to `## Assumptions` in `overview.md`.

Request: `{ "pointId": "core-loop", "reason": "decide later" }`

### `POST /ideas/:id/interview/plan`

Generate the plan from resolved decisions. Returns a **diff preview only** —
nothing is written.

Response: per section, `{ section, before, after, groundedBy[], inferred }`

Approval is a separate call so a destructive write is always a distinct,
intentional user action:

### `PUT /ideas/:id/interview/plan`

Apply the previewed plan. Calls `writePlanningSection` per section and creates
`Task` rows grouped by milestone.

Request: `{ "confirm": true }`

### `DELETE /ideas/:id/interview`

Discard the interview. Leaves planning docs untouched — this removes the
interview record, not the user's work.

## Client Integration

`apps/client/src/axios.ts` is a plain JSON client with a bearer interceptor and
single-flight refresh. It has **no streaming**, and interview turns take
several seconds because they involve a model call.

Two options, both acceptable:

1. **Add a fetch-stream hook** for progress events (thinking → retrieved
   decision points → rendered question). Higher fidelity, more work.
2. **Non-streaming with deliberate pending states.** Cheaper and faster to
   ship. The panel must show a distinct "thinking" state per phase, otherwise
   it reads as a hung app.

Recommendation: ship option 2 for the MVP, since the panel has a natural
skeleton (question card skeleton) and streaming is not load-bearing for the
feature's value. Revisit if users report perceived slowness.

## i18n

All interview strings land in `en`, `es`, and `fr`. Model output is generated
in the user's locale — the locale is passed into the prompt, not appended as
an afterthought. Trade-off option pros/cons come back from the model already
translated, so no client-side translation table is needed for generated
content. Only chrome and fixed labels are static strings.
