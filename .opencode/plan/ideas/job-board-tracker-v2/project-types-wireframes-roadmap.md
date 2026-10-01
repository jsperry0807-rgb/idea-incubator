# Idea Incubator v2 — Project Types + Wireframes Roadmap

## Timeline

| Phase | Weeks | Focus                                                       |
| ----- | ----- | ----------------------------------------------------------- |
| 9     | 19–20 | Project-type planning scaffolds (software / game / website) |
| 10    | 21–22 | Wireframes folder (upload / view / delete HTML mockups)     |

**Total: ~22 weeks**

---

## Phase 9: Project-Type Planning Scaffolds (Weeks 19-20)

**Goal:** Each new idea's planning folder scaffolds docs based on its project type (SOFTWARE default, GAME, WEBSITE); type locked at creation.

- [ ] Shared: `IdeaProjectType` enum (`SOFTWARE | GAME | WEBSITE`) + wire into `createIdeaSchema.projectType` (default `SOFTWARE`)
- [ ] Shared: widen `PLANNING_SECTION_NAMES` to the union (`pages, content, seo, mechanics, progression, art-audio, playtest` added)
- [ ] Server: Prisma migration — `Idea.projectType`, default `SOFTWARE`, client regenerated
- [ ] Server: `planningTemplates.ts` → per-type template map; file lists: SOFTWARE (today's 4 + risks on demand), WEBSITE (+`pages`, `content`, `seo` on demand), GAME (+`mechanics`, `progression`, `art-audio`; `playtest`, `risks` on demand); `getTemplate(type, section)` type-validated
- [ ] Server: `createIdea` scaffolds per type; `projectType` in DTO
- [ ] Server: planning list/create-on-demand filtered/validated per idea's type
- [ ] Client: Create Idea form — "Project type" pill radiogroup + per-type folder preview
- [ ] Client/i18n: type + section labels (en, fr, es)
- [ ] QA: typecheck/lint/build + smoke test creating one idea of each type

**Deliverable:** New ideas scaffold the right .md set for their type; existing ideas unchanged (default SOFTWARE).

---

## Phase 10: Wireframes (Weeks 21-22)

**Goal:** Each idea gets a `wireframes/` subfolder users can upload HTML templates into, view them sandboxed, and delete them.

- [ ] Shared: `schemas/wireframe.ts` — slug-safe name schema, upload schema (`filename` + `html` ≤ 500KB), params, DTOs
- [ ] Server: storage methods — `listWireframes` / `writeWireframe` / `readWireframe` (+ delete via filename), `.html`-only validation, folder made at idea creation
- [ ] Server: `wireframe.routes.ts` — list / upload / read (JSON envelope) / delete; permissions mirroring planning
- [ ] Client: Wireframes section on IdeaDetailPage — upload (`<input accept=".html">`, client-side read), chip list, view modal with `<iframe sandbox="allow-scripts" srcDoc>`, delete
- [ ] Client: Create Idea folder preview gains `wireframes/`
- [ ] Client/i18n: wireframe strings (en, fr, es)
- [ ] QA: full flow (upload → view → delete) + typecheck/lint/build

**Deliverable:** Users can upload, preview, and manage HTML wireframe templates per idea, safely sandboxed.
