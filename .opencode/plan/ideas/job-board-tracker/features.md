# Idea Incubator — Features

## Phase 1: Foundation (Weeks 1-3)

### Server

- Add Prisma with PostgreSQL connection + schema (User, Idea, Tag, Task, Comment, Share, Notification, RefreshToken)
- `prisma migrate dev` for local development
- Auth middleware (JWT verify via `jose`, attach `userId` to request)
- Error handling middleware (custom error classes -> `ApiEnvelope` responses)
- Auth routes:
  - `POST /auth/register` — create account, return access token + set refresh cookie
  - `POST /auth/login` — authenticate, return access token + set refresh cookie
  - `POST /auth/refresh` — rotate refresh token, return new access token
  - `GET /auth/me` — return current user profile
- Validation with `zod` on all inputs
- Rate limiting (global: 100 req/15min, auth: 10 req/15min)
- Helmet security headers
- CORS configuration

### Client

- Auth feature module (`feature/auth/`):
  - `api/auth.ts` — login, register, refresh, me API calls
  - `context/AuthContext.tsx` — auth provider with user state, login/logout functions
  - `hooks/useAuth.ts` — consume auth context
  - `components/LoginForm.tsx` — email + password form
  - `components/RegisterForm.tsx` — name + email + password + confirm form
  - `components/ProtectedRoute.tsx` — redirect to /login if unauthenticated
- Axios interceptor to attach JWT from memory + handle 401 -> auto refresh
- Zustand UI store (sidebar state, theme)
- Update routes: `/login`, `/register`, `/dashboard`
- Build reusable UI primitives in `@repo/ui`:
  - Button (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
  - Input (with label, error state, icon slot)
  - Textarea
  - Modal (with close button, backdrop click, Esc key)
  - Card
  - Badge (status colors)
  - Spinner
  - Toast + Toaster (success, error, info)
  - EmptyState
- Global CSS: CSS custom properties for light/dark theme (already exists, extend)

## Phase 2: Ideas CRUD + Tags (Weeks 4-5)

### Server

- `GET /ideas` — list with filters (status, priority, tag, search), pagination, sort
- `GET /ideas/:id` — single idea with tasks, tags, user info
- `POST /ideas` — create idea + auto-generate planning folder with default .md files
- `PATCH /ideas/:id` — update idea (title, description, status, priority, tags)
- `DELETE /ideas/:id` — delete idea + planning folder (cascade)
- Tag CRUD: `GET /tags`, `POST /tags`, `PATCH /tags/:id`, `DELETE /tags/:id`
- All scoped to authenticated user

### Client

- Ideas feature module (`feature/ideas/`):
  - `api/ideas.ts` — CRUD API calls
  - `hooks/useIdeas.ts` — TanStack Query list with filters
  - `hooks/useIdea.ts` — single idea query
  - `hooks/useCreateIdea.ts`, `useUpdateIdea.ts`, `useDeleteIdea.ts` — mutations
  - `components/IdeaCard.tsx` — card for grid view (title, status badge, priority dot, tags, task progress)
  - `components/IdeaGrid.tsx` — auto-fill grid layout
  - `components/IdeaListRow.tsx` — row for list view
  - `components/IdeaFilters.tsx` — status tabs, priority filter, tag filter
  - `components/IdeaSearch.tsx` — debounced search input with `/` shortcut
  - `components/CreateIdeaForm.tsx` — title, description, status, priority, tags, planning folder preview
  - `components/StatusBadge.tsx` — colored badge per status
  - `components/PriorityDot.tsx` — colored dot per priority
  - `components/TagBadge.tsx` — tag with optional color
  - `pages/IdeasPage.tsx` — grid/list toggle, search, filters, idea cards
  - `pages/CreateIdeaPage.tsx` — create form with back link
- Tags feature module (`feature/tags/`):
  - `api/tags.ts` — CRUD
  - `hooks/useTags.ts` — list user's tags
  - `components/TagManager.tsx` — create/edit/delete tags
  - `pages/TagsPage.tsx`
- Search bar with debounced filtering (300ms)
- Grid/List view toggle (persisted in Zustand)
- Status filter tabs: All, Idea, Planning, Planned, In Progress, Done, Archived

## Phase 3: Planning Sections (Weeks 6-7)

### Server

- `GET /ideas/:id/planning/:section` — read a planning section file (overview, tech-stack, features, timeline, risks)
- `PUT /ideas/:id/planning/:section` — write/update a planning section file (create if doesn't exist)
- `FileStorageService` — abstracted file read/write with path validation (prevent traversal)

### Client

- Idea-detail feature module (`feature/idea-detail/`):
  - `api/planning.ts` — read/write planning sections
  - `hooks/usePlanning.ts` — TanStack Query for section content
  - `components/PlanningSection.tsx` — markdown viewer/editor for a single section
  - `components/PlanningAccordion.tsx` — collapsible accordion with 5 sections (Overview, Tech Stack, Features, Timeline, Risks)
  - `components/IdeaMeta.tsx` — status, priority, tags, dates, action buttons
  - `components/ImportMarkdownModal.tsx` — drag-and-drop .md file import + template buttons
  - `pages/IdeaDetailPage.tsx` — full idea detail layout (meta + accordion + tasks + comments)
- Markdown rendering (use `react-markdown` or similar)
- Markdown editor (textarea with monospace font, or a lightweight editor)
- "Risks" section created on demand (button to create `risks.md`)
- **Rich planning templates** — each generated `.md` file contains structured templates with:
  - Section headers matching comprehensive planning structure
  - Tables with example rows showing expected format
  - HTML comments with guidance (hidden in rendered markdown)
  - Placeholder examples that users edit directly
  - See `planning-templates.md` for full template content
- **Template customization** — users can edit, add, delete, and reorder planning sections

## Phase 4: Tasks + Milestones (Weeks 8-9)

### Server

- `GET /ideas/:id/tasks` — list tasks ordered by milestone + sortOrder
- `POST /ideas/:id/tasks` — create task
- `PATCH /ideas/:id/tasks/:taskId` — update task (title, completed, milestone, sortOrder)
- `DELETE /ideas/:id/tasks/:taskId` — delete task

### Client

- `hooks/useTasks.ts` — TanStack Query for task list
- `hooks/useCreateTask.ts`, `useUpdateTask.ts`, `useDeleteTask.ts` — mutations
- `components/TaskList.tsx` — grouped by milestone with progress bar
- `components/TaskItem.tsx` — checkbox + title + milestone badge, drag handle for reorder
- Progress calculation: completed tasks / total tasks per milestone and overall
- "+ Add task" button with inline form
- Milestone selector (dropdown or free text)

## Phase 5: Kanban Roadmap (Weeks 10-11)

### Server

- `GET /ideas/pipeline` — ideas grouped by status (IDEA, PLANNING, PLANNED, IN_PROGRESS, DONE, ARCHIVED)
- `PATCH /ideas/:id/status` — quick status change (used by drag-and-drop)

### Client

- Roadmap feature module (`feature/roadmap/`):
  - `hooks/usePipeline.ts` — TanStack Query for pipeline data
  - `components/KanbanBoard.tsx` — 6-column horizontal layout with `@dnd-kit/core`
  - `components/KanbanColumn.tsx` — single status column with count + cards
  - `components/KanbanCard.tsx` — compact card (title, priority dot, tags, progress bar, task count)
  - `components/DragOverlay.tsx` — visual feedback during drag
  - `pages/RoadmapPage.tsx` — full Kanban view with header
- Drag-and-drop: drag card between columns to change status
- Optimistic updates: move card instantly, rollback on error
- Column headers show count of ideas in each status
- Filter bar above columns (filter by tag, priority)

## Phase 6: Dashboard + Analytics (Weeks 12-13)

### Server

- `GET /dashboard/stats` — aggregate counts by status, total tasks, completed tasks
- `GET /dashboard/activity` — recent activity (last 10 actions: status changes, comments, shares)

### Client

- Dashboard feature module (`feature/dashboard/`):
  - `api/dashboard.ts` — stats + activity API calls
  - `hooks/useDashboard.ts` — TanStack Query for stats
  - `components/StatsGrid.tsx` — 4 stat cards (total ideas, in planning, planned, done)
  - `components/ActivityFeed.tsx` — recent activity with colored dots and timestamps
  - `components/NeedsAttention.tsx` — ideas that need action (stuck in planning, no recent updates)
  - `components/IdeaProgressCard.tsx` — idea card with progress bar for dashboard
  - `pages/DashboardPage.tsx` — greeting, stats, activity, needs attention, in-progress section
- Recharts: bar chart for ideas by status (optional, can add later)

## Phase 7: Collaboration (Weeks 14-16)

### Server

- Share management:
  - `GET /ideas/:id/shares` — list users with access (owner only)
  - `POST /ideas/:id/shares` — share by email (owner only)
  - `PATCH /ideas/:id/shares/:shareId` — change role (owner only)
  - `DELETE /ideas/:id/shares/:shareId` — remove access (owner only)
  - `GET /ideas/shared` — ideas shared with current user
- Comments:
  - `GET /ideas/:id/comments` — list comments
  - `POST /ideas/:id/comments` — add comment (sends notification)
  - `PATCH /ideas/:id/comments/:commentId` — edit comment (owner only)
  - `DELETE /ideas/:id/comments/:commentId` — delete (comment owner or idea owner)
- Notifications:
  - `GET /notifications` — list with unread count
  - `PATCH /notifications/:id/read` — mark read
  - `POST /notifications/read-all` — mark all read

### Client

- Collaboration feature module (`feature/collaboration/`):
  - `api/shares.ts` — share management API
  - `hooks/useShares.ts`, `useSharedWithMe.ts` — queries
  - `components/ShareModal.tsx` — email invite + access list with role dropdown
  - `components/ShareList.tsx` — list of users with access
  - `components/InviteForm.tsx` — email input + role selector
  - `components/AccessRoleSelect.tsx` — Owner/Edit/View dropdown
- Comments in idea-detail:
  - `hooks/useComments.ts` — query + mutations
  - `components/CommentThread.tsx` — list of comments with avatars, timestamps
  - `components/CommentForm.tsx` — textarea + submit
- Notifications feature module (`feature/notifications/`):
  - `api/notifications.ts` — list + mark read
  - `hooks/useNotifications.ts` — query with unread count
  - `components/NotificationBell.tsx` — bell icon with unread badge in header
  - `components/NotificationPanel.tsx` — dropdown panel with notification list
  - `components/NotificationItem.tsx` — single notification with icon, message, time
- "Shared with me" page in sidebar

## Phase 8: Polish (Weeks 17-18)

### Keyboard Shortcuts

- `/` — focus search bar
- `n` — open create idea modal/page
- `Esc` — close modals/panels
- `Cmd+Enter` — save form
- `?` — show keyboard shortcut help modal

### Dark Mode Refinements

- Test all new components in both themes
- Ensure Kanban board, planning sections, comments all look correct
- Persist theme choice in localStorage

### Mobile Responsive

- Sidebar collapses to hamburger on mobile
- Kanban board: horizontal scroll on tablet, stacked columns on mobile
- Idea cards: single column on mobile
- Planning accordion: full-width on mobile
- Comment thread: full-width on mobile

### i18n

- Add translation keys for all new features (en/es/fr)
- Date formatting per locale
- Status/priority labels per locale

### Accessibility

- WCAG 2.1 AA compliance
- Semantic HTML throughout
- ARIA labels on interactive elements
- Focus management in modals
- Screen reader announcements for drag-and-drop
- Color contrast ratios >= 4.5:1

### Settings

- Profile page (name, email, avatar)
- Theme toggle
- Account deletion
