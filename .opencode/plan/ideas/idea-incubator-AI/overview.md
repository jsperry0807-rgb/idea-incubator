# Overview

## What It Is

Idea Incubator AI is a Socratic interview agent that sits on top of the
existing idea detail page. A user describes an idea in plain language — "I
want to make a clicker game" — and the agent responds by identifying the
domain, surfacing the decisions that actually block progress, and asking
**one question at a time**. Each question presents trade-off options so the
user is deciding, not guessing.

The critical property is that questions are **generated on the fly from the
user's specific idea**, never pulled from a static template. After every
answer the agent re-evaluates which decision points were resolved, which were
invalidated, and which *new* ones the answer just opened up — then branches.
When a user is visibly stuck on a decision, the agent produces a synthesized
debate verdict (Recommendation, Key Tradeoffs, Strongest Disagreement) rather
than silently picking for them.

Once enough context is accumulated, the agent generates a structured plan that
populates the planning docs the app already has, so every plan section is
grounded in a decision the user actually made.

## Who It's For

- **Primary:** Existing idea-incubator users who describe an idea in one or
  two sentences and currently get a blank set of markdown templates. They want
  the hard design decisions surfaced before they write a word.
- **Secondary:** Users returning to a previously vague idea who want the agent
  to re-open the unresolved decisions rather than start over.
- **Secondary:** Solo builders who want an adversarial second opinion on a
  decision they are stuck on, without leaving the page.

## Core Concepts

- **Decision point** — a stable-ID'd unresolved architectural question, with a
  priority tier, a set of implementation paths it eliminates, and the planning
  sections it feeds. The stable ID is the mechanism that prevents static
  templates: a question cannot be re-asked, and a new question cannot appear
  unless a specific answer opened it.
- **Dynamic generation** — decision points are produced by a model reading the
  user's own words each turn, not selected from a bank.
- **Branching** — answering one decision point closes it and may open a
  different set of downstream points. "Pure-incremental" and "hybrid" core
  loops lead to materially different question sequences.
- **Stuck synthesis** — after repeated non-answers on the same point, the
  agent runs a multi-perspective debate and returns a structured verdict
  instead of looping forever.
- **Grounded plan** — every generated planning section cites the decisions that
  grounded it and labels anything inferred, so the user can tell the
  difference between what they chose and what the model assumed.

## Key Screens

| Screen | Purpose |
| ------ | ------- |
| Interview panel | Full-height panel on IdeaDetailPage: question card with trade-off option table, one question at a time, free-text fallback |
| Synthesis card | Appears in-place when the user is stuck: Recommendation, Key Tradeoffs, Strongest Disagreement |
| Decision log | Collapsible review of every decision made, its options, and what the chosen option opened or closed |
| Plan review diff | Before writing, shows a diff of each section against existing markdown so hand-edits are never silently clobbered |
| Tail collection | Optional flag-gated form for remaining structured data (budget, team, deadline) after decisions are resolved |

## Design Principles

- **One question at a time.** Deliberately inverts the existing
  `question-flow.md` convention (max 3, one batch). A batch forces the user to
  answer three decisions while holding none in working memory; a trade-off
  table needs focus to be read properly.
- **Questions reveal consequences, not data.** Every question must eliminate
  at least one implementation path. If it does not, it is deleted. This is
  enforced by a runtime validator, not left to prompt discipline.
- **Never decide for the user silently.** If the model has a preference it is
  surfaced as a labelled default, with the rationale shown.
- **Show the inference boundary.** Grounded vs. inferred content is always
  distinguishable in generated output.
- **Markdown-first.** All output lands in the existing planning docs, rendered
  with the existing `react-markdown` viewer. No new document format.
- **Respect hand-edits.** The agent proposes; the user approves the write.

## Assumptions

- Project type assumed: SOFTWARE (a feature added to the existing web app)
- Audience assumed: existing idea-incubator users, not an external market
- Scope assumed: MVP — single interview per idea, no multi-user live collab
- Engine assumed: hand-rolled pure reducer persisted in one Prisma table,
  **not** LangGraph. The graph is ~6 nodes; durable state is one row.
- Synthesis assumed: the brainstorm-mcp *synthesis prompt* is ported and
  reimplemented against our own LLM client. The MCP server itself is **not**
  wired in — it is a stdio tool for coding agents, not a library or HTTP API.
- Questioning assumed: hand-rolled. Chatfield is deliberately **excluded**
  from the questioning phase because it requires a schema known up front,
  which defeats dynamic decision-point discovery. It is tail-only, ~15
  fields, behind a feature flag.
- Protocol assumed: the LotusADSP `brainstorming` skill contributes its
  *principles* (priority tiers, minimum-viable-question test, question
  anatomy) and **not** its domain question banks, which cover only
  E-Commerce / Auth / Real-time / CMS and would reintroduce exactly the
  static templating this feature exists to avoid.
- Project type assumed: the enum is widened to add `SAAS` and `PHYSICAL`, and
  `updateIdeaSchema` gains a `projectType` field so a mis-picked type is
  correctable.
- Assumption recording: any decision the user defers or skips is written to
  `## Assumptions` in `overview.md`, matching the existing planner skill.
