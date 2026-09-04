// Default markdown templates generated for every new idea.
// Each template is a starting point — section headers, tables, and
// guidance comments guide the user; content is editable per-idea.

export const PLANNING_SECTIONS = [
  "overview",
  "tech-stack",
  "features",
  "timeline",
] as const;

export type PlanningSection = (typeof PLANNING_SECTIONS)[number];

export const PLANNING_TEMPLATES: Record<PlanningSection, string> = {
  overview: `# Overview

<!-- What is this idea? Who is it for? Keep this section short — 2-3 sentences. -->

## What It Is

_A one-paragraph description of the product or project._

## Who It's For

- Primary audience
- Secondary audience

## Core Concepts

- Concept 1
- Concept 2
- Concept 3

## Key Screens

| Screen | Purpose |
| ------ | ------- |
| Home | _e.g. Landing page_ |
| Dashboard | _e.g. Overview of key data_ |

## Design Principles

- Principle 1
- Principle 2
`,
  "tech-stack": `# Tech Stack

<!-- Core technologies you plan to build with. -->

## Core Stack

| Layer | Technology | Notes |
| ----- | ---------- | ----- |
| Frontend | _e.g. React 19 + Vite_ | |
| Backend | _e.g. Express 5_ | |
| Database | _e.g. PostgreSQL_ | |
| ORM | _e.g. Prisma_ | |

## New Additions

<!-- Frameworks or libraries you are evaluating, not yet committed to. -->

| Technology | Why | Risk |
| ---------- | --- | ---- |

## Database Choice

_Why this database / schema design fits the project._

## Services & Integrations

- Integration 1
- Integration 2
`,
  "features": `# Features

<!-- Break the build into phases. Each phase should have server + client tasks. -->

## Phase 1: Foundation

- [ ] Server: _task_
- [ ] Client: _task_

## Phase 2: Core

### Server

- [ ] _task_

### Client

- [ ] _task_

## Phase 3: Polish

- [ ] _task_
`,
  "timeline": `# Timeline

<!-- Rough week-by-week plan. Adjust as reality sets in. -->

## Phases

| Phase | Weeks | Focus |
| ----- | ----- | ----- |
| 1 | 1-2 | _Foundation_ |
| 2 | 3-4 | _Core features_ |
| 3 | 5-6 | _Polish + ship_ |

## Milestones

- **M1** — _Definition of done for first usable version_
- **M2** — _Definition of done for public launch_

## Deliverables

- Deliverable 1
- Deliverable 2
`,
};

export const RISKS_SECTION = "risks" as const;

export const RISKS_TEMPLATE = `# Risks

<!-- Add risks as you identify them. Created on demand. -->

## Open Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| _Risk_ | High/Med/Low | High/Med/Low | _Mitigation_ |

## Resolved Risks

| Risk | Outcome |
| ---- | ------- |
`;

export function getTemplate(section: string): string | undefined {
  if (section === RISKS_SECTION) return RISKS_TEMPLATE;
  return PLANNING_TEMPLATES[section as PlanningSection];
}