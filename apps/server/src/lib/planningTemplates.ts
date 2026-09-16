// Planning-aware markdown templates, keyed by idea project type.
// Each template is a starting point — section headers, tables, and
// guidance comments guide the user; content is editable per-idea.

import type { IdeaProjectType } from "@repo/shared";

export type PlanningSection =
  | "overview"
  | "tech-stack"
  | "features"
  | "timeline"
  | "risks"
  | "pages"
  | "content"
  | "seo"
  | "mechanics"
  | "progression"
  | "art-audio"
  | "playtest";

type TemplateMap = Record<PlanningSection, string>;

const SOFTWARE_OVERVIEW = `# Overview

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
`;

const WEBSITE_OVERVIEW = `# Overview

<!-- What site is this, and what should visitors do when they land on it? -->

## What It Is

_A one-paragraph description of the site._

## Who It's For

- Primary audience
- Secondary audience

## Primary Goal

_The one action most visitors should take (contact, sign up, buy...)._

## Key Screens

| Page | Purpose |
| ---- | ------- |
| Home | _e.g. Landing page_ |
| About | _e.g. Who you are_ |
| Contact | _e.g. How to reach you_ |

## Design Principles

- Principle 1
- Principle 2
`;

const GAME_OVERVIEW = `# Overview

<!-- What is this game in one sentence? What's the feeling you want players to have? -->

## What It Is

_A one-paragraph description of the game._

## Who It's For

- Primary audience
- Secondary audience

## Core Concepts

- Concept 1
- Concept 2
- Concept 3

## Player Fantasy

_What does the player get to be or do? Why do they keep coming back?_

## Key Screens

| Screen | Purpose |
| ------ | ------- |
| Menu | _e.g. Start, options, credits_ |
| Gameplay | _e.g. Core session loop_ |

## Design Principles

- Principle 1
- Principle 2
`;

const TECH_STACK = `# Tech Stack

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
`;

const FEATURES = `# Features

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
`;

const PAGES = `# Pages

<!-- Every page the site needs, in build order. Add states (empty/error) as notes. -->

## Sitemap

| Page | Route | Purpose | Priority |
| ---- | ----- | ------- | -------- |
| Home | / | _e.g. Landing_ | High |
| About | /about | _e.g. About you_ | Medium |

## Page Details

### Home

- Sections, top to bottom:
- Primary CTA:
- Assets needed:

## Navigation

- Header links:
- Footer links:
- Mobile behavior:
`;

const CONTENT = `# Content

<!-- Copy inventory: what text, images, and media each page needs. -->

## Voice & Tone

_Describe how the site sounds. Book smarter, or friendly and casual?_

## Copy by Page

| Page | Headline | Body | CTA |
| ---- | -------- | ---- | --- |
| Home | | | |

## Media

| Asset | Where It's Used | Status |
| ----- | --------------- | ------ |
| Hero image | Home | _To create_ |

## Placeholder Strategy

_How to handle missing content until real copy/media is ready._
`;

const SEO = `# SEO

<!-- Page-by-page search targets. Created on demand. -->

## Keyword Targets

| Page | Primary Keyword | Secondary Keywords |
| ---- | --------------- | ------------------ |

## Metadata

| Page | Title | Description |
| ---- | ----- | ----------- |

## Technical SEO

- [ ] Sitemap generated
- [ ] robots.txt
- [ ] Open Graph tags
- [ ] Semantic headings
`;

const MECHANICS = `# Mechanics

<!-- The rules of the game. Every mechanic the player touches goes here. -->

## Core Loop

1. _Step_
2. _Step_
3. _Reward / state change_
4. Back to 1.

## Mechanics List

| Mechanic | Description | Tunable Values |
| -------- | ----------- | -------------- |

## Controls

| Action | Input |
| ------ | ----- |

## States

| State | Trigger | Effect |
| ----- | ------- | ------ |

## Edge Cases

- What happens if the player...
`;

const PROGRESSION = `# Progression

<!-- How the player grows over time: levels, unlocks, difficulty, balance. -->

## Progression Overview

_If progression exists, how does it work? (XP, levels, unlocks, nothing?)_

## Levels / Stages

| Stage | Unlock | Difficulty Beat |
| ----- | ------ | --------------- |

## Balance Spreadsheet

| Stat | Early | Mid | Late |
| ---- | ----- | --- | ---- |

## Difficulty Curve Notes

_Where should the player struggle? Where should they feel powerful?_
`;

const ART_AUDIO = `# Art & Audio

<!-- Visual style and audio direction. Asset list, not a moodboard dump. -->

## Art Direction

- Style keywords:
- Color palette:
- Reference games/sites:

## Asset List

| Asset | Type | Size/Spec | Status |
| ----- | ---- | --------- | ------ |

## Audio

| Sound/Music | Trigger/Loop | Status |
| ----------- | ------------ | ------ |
`;

const TIMELINE = `# Timeline

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
`;

const RISKS = `# Risks

<!-- Add risks as you identify them. Created on demand. -->

## Open Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| _Risk_ | High/Med/Low | High/Med/Low | _Mitigation_ |

## Resolved Risks

| Risk | Outcome |
| ---- | ------- |
`;

const PLAYTEST = `# Playtest Notes

<!-- Every playtest session gets a short entry. Created on demand. -->

## Questions

_What are you unsure about right now? What should every playtest answer?_

## Sessions

| Date | Build | Tester | Notes | Follow-up |
| ---- | ----- | ------ | ----- | --------- |
`;

const OVERVIEW_BY_TYPE: Record<IdeaProjectType, string> = {
  SOFTWARE: SOFTWARE_OVERVIEW,
  WEBSITE: WEBSITE_OVERVIEW,
  GAME: GAME_OVERVIEW,
};

const SECTION_TEMPLATES: Omit<TemplateMap, "overview"> = {
  "tech-stack": TECH_STACK,
  features: FEATURES,
  timeline: TIMELINE,
  risks: RISKS,
  pages: PAGES,
  content: CONTENT,
  seo: SEO,
  mechanics: MECHANICS,
  progression: PROGRESSION,
  "art-audio": ART_AUDIO,
  playtest: PLAYTEST,
};

/** Sections written immediately when an idea of each type is created. */
export const CREATED_SECTIONS_BY_TYPE: Record<
  IdeaProjectType,
  readonly PlanningSection[]
> = {
  SOFTWARE: ["overview", "tech-stack", "features", "timeline"],
  WEBSITE: ["overview", "pages", "content", "tech-stack", "timeline"],
  GAME: [
    "overview",
    "mechanics",
    "progression",
    "art-audio",
    "tech-stack",
    "timeline",
  ],
};

export const ON_DEMAND_SECTIONS: Record<IdeaProjectType, readonly PlanningSection[]> = {
  SOFTWARE: ["risks"],
  WEBSITE: ["risks", "seo"],
  GAME: ["risks", "playtest"],
};

export function sectionsForType(type: IdeaProjectType): {
  created: readonly PlanningSection[];
  onDemand: readonly PlanningSection[];
} {
  return {
    created: CREATED_SECTIONS_BY_TYPE[type],
    onDemand: ON_DEMAND_SECTIONS[type],
  };
}

export function getTemplate(
  type: IdeaProjectType,
  section: string,
): string | undefined {
  const { created, onDemand } = sectionsForType(type);
  const all = [...created, ...onDemand];
  if (!all.includes(section as PlanningSection)) {
    return undefined;
  }
  if (section === "overview") {
    return OVERVIEW_BY_TYPE[type];
  }
  return SECTION_TEMPLATES[section as Exclude<PlanningSection, "overview">];
}
