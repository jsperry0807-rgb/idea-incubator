# Idea Incubator — Planning Document Checklist

This file tracks the completion status of every planning document in this idea
folder. A document is **Done** when its content is comprehensive and ready to
guide implementation (not a stub or placeholder).

## Status Key

- **[x]** Done — comprehensive, ready to implement
- **[ ] Pending** — needs to be created or completed

---

## Planning Documents

| Document                | Status   | Notes                                                                       |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `overview.md`           | [x] Done | What the app is, who it's for, core concepts, screens, design principles    |
| `architecture.md`       | [x] Done | Full DB schema (8 models), server structure, client structure, file storage |
| `api.md`                | [x] Done | Complete API contract (25+ endpoints with request/response examples)        |
| `features.md`           | [x] Done | 8 phases with detailed server + client tasks                                |
| `tech-stack.md`         | [x] Done | All dependencies (server, client, dev)                                      |
| `roadmap.md`            | [x] Done | 18-week timeline with checkboxes per task                                   |
| `planning-templates.md` | [x] Done | Rich templates auto-generated for each new idea                             |
| `feature-structure.md`  | [x] Done | File-by-file breakdown of all 9 feature modules                             |
| `ui-components.md`      | [x] Done | Every component with props interfaces and variants                          |
| `state-management.md`   | [x] Done | TanStack Query + Zustand + React Context + React Hook Form strategy         |
| `validation.md`         | [x] Done | All Zod schemas (auth, ideas, tags, tasks, comments, shares, planning)      |
| `security.md`           | [x] Done | JWT flow, CORS, rate limiting, helmet, row-level security, path traversal   |
| `testing.md`            | [x] Done | Vitest + RTL + MSW + Playwright strategy with coverage targets              |
| `error-handling.md`     | [x] Done | Custom error classes, error middleware, client error patterns               |
| `environment.md`        | [x] Done | All env vars, .env structure, per-environment overrides                     |
| `deployment.md`         | [x] Done | Vercel + Railway architecture, CI/CD pipeline, production checklist         |
| `accessibility.md`      | [x] Done | WCAG 2.1 AA targets, ARIA labels, focus management, keyboard shortcuts      |
| `performance.md`        | [x] Done | Bundle targets, code splitting, caching strategy, optimistic updates        |

---

## Next Steps

The planning is **complete**. Once implementation begins, update this checklist
only when planning documents are revised or new ones are added.

To add a new planning document to track:

1. Create the `.md` file in `.opencode/plan/ideas/job-board-tracker/`
2. Add it to the table above
3. Mark it `[ ] Pending` until it's comprehensive
