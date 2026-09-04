# Idea Incubator — Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Pages    │  │ Features │  │  @repo/ui         │  │
│  │  (routes) │→ │ (slices) │→ │  (primitives)     │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│       │              │                               │
│       ▼              ▼                               │
│  ┌──────────────────────────────────────────────┐    │
│  │  TanStack Query  │  Zustand  │  React Hook   │    │
│  │  (server state)  │  (UI)     │  Form (forms) │    │
│  └──────────────────────────────────────────────┘    │
│       │                                              │
│       ▼                                              │
│  ┌──────────────┐                                    │
│  │  Axios       │                                    │
│  │  (HTTP)      │                                    │
│  └──────────────┘                                    │
└───────────────────────┬─────────────────────────────┘
                        │ REST API
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Server (Express)                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Routes   │  │Middleware│  │  Services          │  │
│  │  (REST)   │→ │(auth,    │→ │  (business logic)  │  │
│  └──────────┘  │ validate)│  └───────────────────┘  │
│                └──────────┘           │              │
│                                       ▼              │
│  ┌──────────────────┐  ┌───────────────────────┐    │
│  │  Prisma Client    │  │  File Storage         │    │
│  │  (PostgreSQL)     │  │  (markdown files)     │    │
│  └──────────────────┘  └───────────────────────┘    │
└───────────────────────┬─────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        ┌──────────┐      ┌──────────────┐
        │PostgreSQL│      │  Filesystem   │
        │  (data)  │      │  (content/)   │
        └──────────┘      └──────────────┘
```

---

## Database Schema (Prisma + PostgreSQL)

### User

```prisma
model User {
  id             String        @id @default(cuid())
  email          String        @unique
  passwordHash   String?
  name           String
  avatarUrl      String?
  authProvider   AuthProvider  @default(LOCAL)
  providerUserId String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  ideas          Idea[]
  comments       Comment[]
  shares         Share[]
  notifications  Notification[]
  tags           Tag[]

  @@map("users")
}
```

### Idea

```prisma
model Idea {
  id          String        @id @default(cuid())
  userId      String
  title       String
  slug        String        @unique
  description String?
  status      IdeaStatus    @default(IDEA)
  priority    IdeaPriority  @default(NONE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags        IdeaTag[]
  comments    Comment[]
  tasks       Task[]
  shares      Share[]

  @@index([userId, status])
  @@index([userId, createdAt(sort: Desc)])
  @@map("ideas")
}

enum IdeaStatus {
  IDEA
  PLANNING
  PLANNED
  IN_PROGRESS
  DONE
  ARCHIVED
}

enum IdeaPriority {
  NONE
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### Tag

```prisma
model Tag {
  id     String    @id @default(cuid())
  userId String
  name   String
  color  String?

  user   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  ideas  IdeaTag[]

  @@unique([userId, name])
  @@map("tags")
}

model IdeaTag {
  ideaId String
  tagId  String

  idea   Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([ideaId, tagId])
  @@map("idea_tags")
}
```

### Task

```prisma
model Task {
  id          String    @id @default(cuid())
  ideaId      String
  title       String
  completed   Boolean   @default(false)
  milestone   String?
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())

  idea        Idea      @relation(fields: [ideaId], references: [id], onDelete: Cascade)

  @@index([ideaId, sortOrder])
  @@map("tasks")
}
```

### Comment

```prisma
model Comment {
  id        String    @id @default(cuid())
  ideaId    String
  userId    String
  content   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  idea      Idea      @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([ideaId, createdAt(sort: Desc)])
  @@map("comments")
}
```

### Share

```prisma
model Share {
  id        String      @id @default(cuid())
  ideaId    String
  userId    String
  role      ShareRole   @default(VIEW)
  createdAt DateTime    @default(now())

  idea      Idea        @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([ideaId, userId])
  @@map("shares")
}

enum ShareRole {
  OWNER
  EDIT
  VIEW
}
```

### Notification

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  message   String
  ideaId    String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read, createdAt(sort: Desc)])
  @@map("notifications")
}

enum NotificationType {
  SHARE
  COMMENT
  MENTION
  TASK_COMPLETED
}
```

### RefreshToken

```prisma
model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  userAgent String?
  ipAddress String?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}
```

---

## File Storage Architecture

### Directory Structure

```
storage/
  content/
    {userId}/
      {ideaId}/
        overview.md
        tech-stack.md
        features.md
        timeline.md
        risks.md              # created on demand
        assets/               # optional, for future image uploads
```

### Rules

- **Filenames are IDs**, not slugs (slugs change; IDs don't)
- **User isolation** enforced by path: `content/{userId}/`
- **Idea isolation** enforced by subpath: `content/{userId}/{ideaId}/`
- **Database is source of truth** for metadata (title, slug, timestamps)
- **Files are the content** -- markdown body for each planning section
- **Abstract the storage layer** behind a `FileStorageService` interface for eventual S3 migration

### Default Content

When an idea is created, the server generates 4 default files with **rich templates**
that guide the user through comprehensive planning. The templates mirror the
structure of the planning files we created for this project — each one contains
section headers, tables, guidance comments, and placeholder examples.

See `planning-templates.md` for the full template content.

**Generated files per idea:**
- `overview.md` — What it is, who it's for, core concepts, key screens, design principles
- `tech-stack.md` — Core stack table, new additions table, database choice
- `features.md` — Phased breakdown with server + client tasks per phase
- `timeline.md` — Phase table with weeks and focus areas, milestones, deliverables
- `risks.md` — Created on demand when user clicks "Add Risks section"

**Template design principles:**
- Every template is a **starting point**, not a blank page
- Templates include **section headers** that match the planning structure
- Templates include **tables** with example rows to show expected format
- Templates include **HTML comments** with guidance (hidden in rendered markdown)
- Users edit the templates directly — no separate "fill in" wizard needed
- Templates are customizable per-idea (the server stores the actual content, not a reference to a template)

---

## Server Architecture

### Directory Structure

```
apps/server/src/
  index.ts                  # Entry point, middleware chain
  app.ts                    # Express app setup (for testing)
  config/
    env.ts                  # Validated env vars (zod)
    cors.ts                 # CORS origin list
  middleware/
    auth.ts                 # JWT verification, attach userId
    validate.ts             # Zod schema validation middleware
    errorHandler.ts         # Centralized error handler
    rateLimit.ts            # Rate limiting config
  routes/
    index.ts                # Mount all route groups
    auth.routes.ts          # POST /auth/register, /login, /refresh, GET /me
    ideas.routes.ts         # CRUD + pipeline endpoints
    tags.routes.ts          # Tag CRUD
    comments.routes.ts      # Comment CRUD per idea
    shares.routes.ts        # Share management
    notifications.routes.ts # Notification list + mark read
    planning.routes.ts      # Planning section file read/write
  services/
    auth.service.ts         # Password hashing, token generation
    ideas.service.ts        # Idea business logic
    tags.service.ts         # Tag business logic
    comments.service.ts     # Comment business logic
    shares.service.ts       # Share business logic
    notifications.service.ts
    planning.service.ts     # File read/write operations
    storage.service.ts      # Abstracted file storage
  lib/
    prisma.ts               # Prisma client singleton
    jwt.ts                  # JWT sign/verify helpers
    errors.ts               # Custom error classes (NotFoundError, ForbiddenError, etc.)
    slug.ts                 # Slug generation from title
  types/
    express.d.ts            # Extend Express Request with userId
    index.ts                # Shared server types
```

### Middleware Chain (order matters)

```
1. helmet()              -> Security headers
2. cors(corsOptions)     -> CORS with explicit origins
3. express.json()        -> Body parsing (limit: 1mb)
4. express-rate-limit    -> Global rate limit (100 req/15min)
5. auth routes           -> /auth/* routes (stricter rate limit: 10 req/15min)
6. auth middleware        -> JWT verify on protected routes
7. API routes            -> Validation + handlers
8. 404 handler           -> Catch-all for unknown routes
9. errorHandler          -> Centralized error middleware
```

---

## Client Architecture

### Directory Structure (Feature-Sliced Design)

```
apps/client/src/
  main.tsx
  App.tsx
  axios.ts                    # Axios instance + interceptors

  config/
    routes.ts                 # Route path constants

  components/
    layout/
      RootLayout.tsx          # Header + Sidebar + Outlet + Footer
      Header.tsx              # Logo + nav + theme toggle + user menu
      Sidebar.tsx             # Nav links (Dashboard, Ideas, Roadmap, Tags, Shared, Settings)
      LanguageSwitcher.tsx
    ui/
      Button.tsx
      Input.tsx
      Textarea.tsx
      Select.tsx
      Modal.tsx
      Card.tsx
      Badge.tsx
      Avatar.tsx
      Tooltip.tsx
      Toast.tsx / Toaster.tsx
      Spinner.tsx
      EmptyState.tsx
      Dropdown.tsx
      Tabs.tsx
      ProgressBar.tsx
      ConfirmDialog.tsx

  feature/
    auth/
      api/auth.ts             # login, register, refresh, me
      hooks/useAuth.ts        # Auth state + login/register/logout
      context/AuthContext.tsx  # Auth provider
      components/LoginForm.tsx
      components/RegisterForm.tsx
      components/ProtectedRoute.tsx
      types.ts

    dashboard/
      api/dashboard.ts        # stats, recent activity
      hooks/useDashboard.ts
      components/StatsGrid.tsx
      components/ActivityFeed.tsx
      components/NeedsAttention.tsx
      components/IdeaProgressCard.tsx
      pages/DashboardPage.tsx
      types.ts

    ideas/
      api/ideas.ts            # CRUD + list + search + filter
      hooks/useIdeas.ts       # List query
      hooks/useIdea.ts        # Single idea query
      hooks/useCreateIdea.ts  # Mutation
      hooks/useUpdateIdea.ts  # Mutation
      hooks/useDeleteIdea.ts  # Mutation
      components/IdeaCard.tsx
      components/IdeaGrid.tsx
      components/IdeaListRow.tsx
      components/IdeaFilters.tsx
      components/IdeaSearch.tsx
      components/CreateIdeaForm.tsx
      components/StatusBadge.tsx
      components/PriorityDot.tsx
      components/TagBadge.tsx
      pages/IdeasPage.tsx
      pages/CreateIdeaPage.tsx
      types.ts

    idea-detail/
      api/planning.ts         # Read/write planning sections
      hooks/useIdeaDetail.ts
      hooks/usePlanning.ts
      hooks/useTasks.ts
      hooks/useComments.ts
      components/PlanningSection.tsx
      components/PlanningAccordion.tsx
      components/TaskList.tsx
      components/TaskItem.tsx
      components/CommentThread.tsx
      components/CommentForm.tsx
      components/IdeaMeta.tsx
      components/ImportMarkdownModal.tsx
      pages/IdeaDetailPage.tsx
      types.ts

    roadmap/
      api/ideas.ts            # Reuse ideas API for pipeline query
      hooks/usePipeline.ts    # Ideas grouped by status
      components/KanbanBoard.tsx
      components/KanbanColumn.tsx
      components/KanbanCard.tsx
      components/DragOverlay.tsx
      pages/RoadmapPage.tsx
      types.ts

    collaboration/
      api/shares.ts           # Share management
      hooks/useShares.ts
      hooks/useSharedWithMe.ts
      components/ShareModal.tsx
      components/ShareList.tsx
      components/InviteForm.tsx
      components/AccessRoleSelect.tsx
      types.ts

    notifications/
      api/notifications.ts    # List + mark read
      hooks/useNotifications.ts
      components/NotificationBell.tsx
      components/NotificationPanel.tsx
      components/NotificationItem.tsx
      types.ts

    tags/
      api/tags.ts             # CRUD
      hooks/useTags.ts
      components/TagManager.tsx
      components/TagForm.tsx
      pages/TagsPage.tsx
      types.ts

    settings/
      pages/SettingsPage.tsx
      components/ProfileForm.tsx
      components/ThemeToggle.tsx
      types.ts

  stores/
    ui.store.ts               # Zustand: sidebar open, theme, modals

  pages/
    HomePage.tsx
    NotFoundPage.tsx
    LoginPage.tsx
    RegisterPage.tsx

  utils/
    cn.ts                     # className merge utility
    debounce.ts
    date.ts                   # Date formatting helpers
    slug.ts                   # Client-side slug generation

  i18n/
    index.ts
    locales/
      en.ts
      es.ts
      fr.ts
```

---

## Architecture Fit

- **Feature-Sliced Design** -- each domain (auth, dashboard, ideas, idea-detail, roadmap, collaboration, notifications, tags, settings) is a `feature/` module with strict boundaries
- **`@repo/shared`** -- shared API types, validation schemas, enums (IdeaStatus, IdeaPriority, ShareRole, NotificationType)
- **`@repo/ui`** -- reusable primitives (Input, Select, Modal, Card, Badge, Avatar, etc.)
- **i18n** -- all strings go through `t()`, add keys for each new feature
- **Axios** -- extend the existing instance with auth interceptors (access token in memory, refresh via cookie)
