# Idea Incubator — Roadmap

## Timeline

| Phase | Weeks | Focus                                                   |
| ----- | ----- | ------------------------------------------------------- |
| 1     | 1–3   | Foundation: DB, auth, client scaffolding, UI primitives |
| 2     | 4–5   | Ideas CRUD + tags + search/filter                       |
| 3     | 6–7   | Planning sections (markdown read/write)                 |
| 4     | 8–9   | Tasks + milestones                                      |
| 5     | 10–11 | Kanban roadmap (drag-and-drop)                          |
| 6     | 12–13 | Dashboard + analytics                                   |
| 7     | 14–16 | Collaboration (sharing, comments, notifications)        |
| 8     | 17–18 | Polish + deploy                                         |

**Total: ~18 weeks**

---

## Phase 1: Foundation (Weeks 1-3)

**Goal:** Working auth system, database connected, client scaffolding complete.

- [x] Set up Prisma schema + PostgreSQL connection
- [x] Run initial migration
- [x] Server: auth routes (register, login, refresh, me)
- [x] Server: auth middleware (JWT verify via jose)
- [x] Server: error handling middleware
- [x] Server: rate limiting + helmet + CORS
- [x] Server: zod validation on all inputs
- [x] Client: auth feature module (login, register, protected routes)
- [x] Client: Axios interceptor (attach JWT, handle 401, auto refresh)
- [x] Client: AuthContext provider
- [x] Client: Zustand UI store
- [x] Client: UI primitives (Button, Input, Textarea, Modal, Card, Badge, Spinner, Toast, EmptyState)
- [x] Client: Route config (/login, /register, /dashboard)
- [x] Shared: API types, validation schemas, enums

**Deliverable:** User can register, log in, see a dashboard shell.

---

## Phase 2: Ideas CRUD + Tags (Weeks 4-5)

**Goal:** Users can create, view, edit, delete ideas with tags and search.

- [x] Server: Ideas CRUD routes (list with filters, get, create, update, delete)
- [x] Server: Tags CRUD routes
- [x] Server: Auto-create planning folder on idea creation
- [x] Client: Ideas list page (grid/list toggle, search, status tabs, tag filter, sort)
- [x] Client: Create idea form (title, description, status, priority, tags, planning folder preview)
- [x] Client: Idea detail page shell (meta, status, priority, tags)
- [x] Client: Tags management page
- [x] Client: StatusBadge, PriorityDot, TagBadge components
- [x] Client: Debounced search, grid/list toggle
- [x] Shared: IdeaStatus, IdeaPriority enums

**Deliverable:** Full ideas CRUD with search, filter, tags.

---

## Phase 3: Planning Sections (Weeks 6-7)

**Goal:** Users can read and edit markdown-backed planning sections for each idea.

- [x] Server: FileStorageService (abstracted file read/write)
- [x] Server: Planning section routes (GET/PUT per section)
- [x] Server: Path traversal prevention
- [x] Client: PlanningAccordion component (5 collapsible sections)
- [x] Client: PlanningSection component (markdown viewer/editor)
- [x] Client: ImportMarkdownModal (drag-and-drop .md upload)
- [x] Client: "Create risks.md" on-demand button
- [x] Client: Markdown rendering (react-markdown)
- [x] Client: Markdown editor (textarea with monospace)
- [x] Client: Wire planning into IdeaDetailPage

**Deliverable:** Users can plan ideas with structured markdown sections.

---

## Phase 4: Tasks + Milestones (Weeks 8-9)

**Goal:** Users can create tasks grouped by milestones with progress tracking.

- [x] Server: Tasks CRUD routes (list, create, update, delete per idea)
- [x] Client: TaskList component (grouped by milestone)
- [x] Client: TaskItem component (checkbox, title, milestone badge)
- [x] Client: Add task inline form
- [ ] Client: Milestone selector
- [ ] Client: Progress bars (per milestone + overall)
- [ ] Client: Task reorder (drag-and-drop within column)
- [ ] Client: Wire tasks into IdeaDetailPage

**Deliverable:** Task management with milestones and progress tracking.

---

## Phase 5: Kanban Roadmap (Weeks 10-11)

**Goal:** Visual Kanban board for moving ideas through status pipeline.

- [ ] Server: Pipeline endpoint (ideas grouped by status)
- [ ] Server: Quick status change endpoint
- [ ] Client: KanbanBoard component (6 columns)
- [ ] Client: KanbanColumn component (header + card list)
- [ ] Client: KanbanCard component (compact idea card)
- [ ] Client: DragOverlay component (visual feedback)
- [ ] Client: @dnd-kit integration (drag between columns)
- [ ] Client: Optimistic updates (instant move, rollback on error)
- [ ] Client: Filter bar (tag, priority)
- [ ] Client: RoadmapPage

**Deliverable:** Drag-and-drop Kanban board.

---

## Phase 6: Dashboard + Analytics (Weeks 12-13)

**Goal:** Overview dashboard with stats, activity, and quick actions.

- [ ] Server: Dashboard stats endpoint
- [ ] Server: Dashboard activity endpoint
- [ ] Client: StatsGrid component (4 stat cards)
- [ ] Client: ActivityFeed component (recent actions)
- [ ] Client: NeedsAttention component (stale ideas)
- [ ] Client: IdeaProgressCard component
- [ ] Client: DashboardPage (greeting, stats, activity, in-progress)
- [ ] Client: Recharts bar chart (optional)

**Deliverable:** Dashboard with stats and activity feed.

---

## Phase 7: Collaboration (Weeks 14-16)

**Goal:** Users can share ideas, leave comments, and receive notifications.

- [ ] Server: Share management routes (add, change role, remove, list)
- [ ] Server: Shared-with-me endpoint
- [ ] Server: Comments CRUD routes
- [ ] Server: Notification routes (list, mark read, mark all read)
- [ ] Server: Auto-create notifications on share/comment
- [ ] Client: ShareModal (email invite + access list)
- [ ] Client: ShareList, InviteForm, AccessRoleSelect
- [ ] Client: CommentThread, CommentForm
- [ ] Client: NotificationBell (header bell with badge)
- [ ] Client: NotificationPanel (dropdown with list)
- [ ] Client: "Shared with me" page
- [ ] Client: Wire comments into IdeaDetailPage

**Deliverable:** Full collaboration with sharing, comments, notifications.

---

## Phase 8: Polish (Weeks 17-18)

**Goal:** Production-ready with keyboard shortcuts, responsive design, accessibility, i18n.

- [ ] Keyboard shortcuts (/ search, n create, Esc close, Cmd+Enter save, ? help)
- [ ] Dark mode refinements (test all components)
- [ ] Mobile responsive (sidebar, Kanban, cards, planning, comments)
- [ ] i18n: add all translation keys (en/es/fr)
- [ ] Accessibility: WCAG 2.1 AA audit
- [ ] Settings page (profile, theme, account deletion)
- [ ] Error boundaries
- [ ] Loading states / skeletons
- [ ] CI/CD: add test step to workflow
- [ ] Deploy: client to Vercel, server to Railway/Render
- [ ] README: screenshots, setup, tech stack, live demo

**Deliverable:** Production-ready application.
