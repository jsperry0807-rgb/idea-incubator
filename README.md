# Idea Incubator

Plan, organize, and ship your ideas. A full-stack idea-tracker with a Kanban
roadmap, markdown planning documents, tasks & milestones, and collaboration
(sharing, comments, notifications).

**Live demo:** `https://<your-client-url>` (replace this)

> ℹ️ The client is a static SPA; the API is a separate Node/Express service.
> If they live on different origins, set the API URL accordingly (see
> [Client environment](#client-environment)).

---

## Screenshots

> Replace each placeholder with a screenshot saved under
> `assets/screenshots/` (or your image host). Suggested captures:
> Dashboard → Ideas (grid) → Roadmap (Kanban) → Idea detail →
> Sharing/notifications → Settings.

| Dashboard | Ideas grid | Roadmap (Kanban) |
| :---: | :---: | :---: |
| `![Dashboard](assets/screenshots/dashboard.png)` | `![Ideas](assets/screenshots/ideas-grid.png)` | `![Roadmap](assets/screenshots/roadmap.png)` |

| Idea detail | Sharing & notifications | Settings |
| :---: | :---: | :---: |
| `![Idea detail](assets/screenshots/idea-detail.png)` | `![Collaboration](assets/screenshots/collaboration.png)` | `![Settings](assets/screenshots/settings.png)` |

---

## Features

- **Ideas** — create, edit, delete; status pipeline (Idea → Planning →
  Planned → In Progress → Done → Archived), priority, tags, search & filters,
  grid/list views.
- **Planning sections** — five collapsible markdown documents per idea with a
  markdown viewer/editor and drag-and-drop `.md` import.
- **Tasks & milestones** — grouped task list with per-milestone and overall
  progress bars and drag-and-drop reordering.
- **Kanban roadmap** — drag ideas between status columns with optimistic
  updates and tag/priority filtering.
- **Dashboard** — stats cards, activity feed, stale-idea alerts, in-progress
  cards, and a status bar chart.
- **Collaboration** — share ideas by email with roles, comment threads,
  notifications (share, comment, mention, task completed).
- **Auth & security** — JWT access tokens + rotating refresh-token cookies,
  bcrypt password hashing, rate limiting, helmet, CORS allow-list, Zod
  validation, path-traversal protection on file reads.
- **Polish** — keyboard shortcuts (`/` search, `n` create, `Esc` close,
  `⌘/Ctrl+Enter` save, `?` help), dark/light/system theme, fully responsive
  layout (mobile drawer), WCAG 2.1 AA audit, error boundaries, skeleton
  loading states, and i18n (English / Español / Français).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript 6, Vite, Tailwind CSS 4, React Router, TanStack Query, Zustand |
| UI | Custom `@repo/ui` primitives (Button, Card, Modal, Toast, Skeleton, …), recharts, @dnd-kit |
| Backend | Node.js, Express 5, TypeScript (tsx runtime) |
| Database | PostgreSQL via Prisma ORM 7 (SQL driver adapter) |
| Auth | JWT (`jose`) + httpOnly refresh cookie, bcryptjs |
| Validation | Zod 4 (shared schemas in `@repo/shared`) |
| i18n | i18next + react-i18next |
| Tooling | pnpm workspaces, ESLint (boundaries), TypeScript project refs |

---

## Project structure

```
├── apps/                    # Things that get deployed
│   ├── client/              # React (Vite) SPA
│   └── server/              # Express API + Prisma
└── packages/                # Libraries consumed by apps (not deployed)
    ├── config/              # Shared tsconfig base (@repo/config)
    ├── shared/              # Shared types, enums, Zod schemas (@repo/shared)
    └── ui/                  # React UI primitives (@repo/ui)
```

---

## Getting started

### Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io/) (the repo pins `pnpm@11.24.0`).
- PostgreSQL 15+ running locally or a connection string.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the server

Prisma reads `DATABASE_URL` from `apps/server/.env` (see
[`apps/server/.env.example`](#server-environment) below for the full list):

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/idea_incubator"
ACCESS_TOKEN_SECRET="<generate-a-long-random-string>"
REFRESH_TOKEN_SECRET="<generate-another-long-random-string>"
```

Then run migrations and generate the client:

```bash
pnpm --filter @repo/server exec prisma migrate dev
```

### 3. Configure the client (optional)

Only needed if the API isn't at `http://localhost:3000`:

```env
# apps/client/.env
VITE_API_URL="http://localhost:3000"
```

### 4. Run it

```bash
pnpm dev            # client + server in parallel
```

- Client: http://localhost:5173
- Server: http://localhost:3000 · health check: http://localhost:3000/health

Register a new account from the UI, then create your first idea.

---

## Environment variables

### Server environment

`apps/server/.env` (values are validated by a Zod schema at boot):

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | – | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | ✅ | – | JWT signing secret for access tokens |
| `REFRESH_TOKEN_SECRET` | ✅ | – | JWT signing secret for refresh tokens |
| `PORT` | – | `3000` | API port |
| `NODE_ENV` | – | `development` | One of `development` \| `test` \| `production` |
| `ACCESS_TOKEN_TTL` | – | `15m` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | – | `30` | Refresh token lifetime in days |
| `CORS_ORIGINS` | – | `http://localhost:5173` | Comma-separated allowed origins |
| `STORAGE_PATH` | – | `./storage` | Directory for planning-section files |

### Client environment

`apps/client/.env`:

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | Base URL of the API |

> Never commit `.env` files. `.env` is gitignored; use a `.env.example` in
> each app as a template.

---

## Useful commands

```bash
pnpm dev              # run client + server in parallel
pnpm build            # build all packages/apps
pnpm lint             # lint the client
pnpm typecheck        # typecheck the whole workspace

pnpm --filter @repo/client exec tsc -b --noEmit   # client only: typecheck
pnpm --filter @repo/client exec eslint src --ext .ts,.tsx
pnpm --filter @repo/client exec vite build         # client only: production build
pnpm --filter @repo/server exec tsx src/index.ts   # server only: run
```

---

## Deployment

### Server

Node/Express service. Set **all** [server env vars](#server-environment),
run `prisma migrate deploy` before first boot, then start:

```bash
cd apps/server
pnpm --filter @repo/server exec prisma migrate deploy
pnpm --filter @repo/server build   # or: pnpm --filter @repo/server exec tsx src/index.ts
```

Deploy as a worker/service (Railway, Render, Fly.io, a VPS, …). Notes:

- Expose `CORS_ORIGINS` pointing at the deployed client.
- Planning sections are stored as files under `STORAGE_PATH` — use a
  **persistent volume** so markdown survives deploys/restarts.

### Client

Static SPA. Build with the production API URL, then serve the `dist` folder
(Vercel, Netlify, Cloudflare Pages, …):

```bash
cd apps/client
VITE_API_URL="https://<your-api-url>" pnpm --filter @repo/client exec vite build
```

Set SPA rewrites so unknown routes fall back to `index.html`.

---

## Roadmap

Tracked in [`.opencode/plan/ideas/job-board-tracker/roadmap.md`](.opencode/plan/ideas/job-board-tracker/roadmap.md).
Phases 1–8: foundation → ideas CRUD → planning sections → tasks/milestones →
Kanban → dashboard/analytics → collaboration → polish (shortcuts, dark mode,
responsive, a11y, i18n, error boundaries, skeletons).