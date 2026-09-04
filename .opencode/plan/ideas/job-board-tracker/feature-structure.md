# Idea Incubator — Feature Module Structure

File-by-file breakdown of every `feature/` module following Feature-Sliced Design.

---

## feature/auth/

```
feature/auth/
  api/
    auth.ts               # login(), register(), refresh(), me() API calls
  hooks/
    useAuth.ts            # Hook to consume AuthContext
  context/
    AuthContext.tsx        # AuthProvider: user state, login, logout, refresh
    AuthContext.test.tsx   # Tests for auth context
  components/
    LoginForm.tsx          # Email + password form
    LoginForm.test.tsx
    RegisterForm.tsx       # Name + email + password + confirm form
    RegisterForm.test.tsx
    ProtectedRoute.tsx     # Wraps routes, redirects to /login if unauthenticated
    ProtectedRoute.test.tsx
  types.ts                 # User, AuthResponse, LoginInput, RegisterInput
  index.ts                 # Barrel exports
```

**Dependencies:** `@repo/shared` (schemas), Axios, React Context

---

## feature/dashboard/

```
feature/dashboard/
  api/
    dashboard.ts           # getStats(), getActivity() API calls
  hooks/
    useDashboard.ts        # TanStack Query for stats + activity
  components/
    StatsGrid.tsx          # 4-card grid (total, planning, planned, done)
    StatsGrid.test.tsx
    ActivityFeed.tsx       # Recent activity list with colored dots
    ActivityFeed.test.tsx
    NeedsAttention.tsx     # Ideas stuck in planning, no updates
    IdeaProgressCard.tsx   # Idea card with progress bar
  pages/
    DashboardPage.tsx      # Greeting, stats, activity, in-progress section
    DashboardPage.test.tsx
  types.ts                 # DashboardStats, ActivityItem
  index.ts
```

**Dependencies:** `@repo/shared` (types), `@repo/ui` (Card, Badge, ProgressBar)

---

## feature/ideas/

```
feature/ideas/
  api/
    ideas.ts               # getIdeas(), getIdea(), createIdea(), updateIdea(), deleteIdea()
  hooks/
    useIdeas.ts            # TanStack Query: list with filters/pagination
    useIdea.ts             # TanStack Query: single idea
    useCreateIdea.ts       # Mutation: create idea
    useUpdateIdea.ts       # Mutation: update idea
    useDeleteIdea.ts       # Mutation: delete idea
  components/
    IdeaCard.tsx           # Card for grid view
    IdeaCard.test.tsx
    IdeaGrid.tsx           # Auto-fill grid layout
    IdeaListRow.tsx        # Row for list view
    IdeaFilters.tsx        # Status tabs + priority/tag filter
    IdeaFilters.test.tsx
    IdeaSearch.tsx         # Debounced search with `/` shortcut
    IdeaSearch.test.tsx
    CreateIdeaForm.tsx     # Full create form with preview
    CreateIdeaForm.test.tsx
    StatusBadge.tsx        # Colored badge per IdeaStatus
    PriorityDot.tsx        # Colored dot per IdeaPriority
    TagBadge.tsx           # Tag with optional color
  pages/
    IdeasPage.tsx          # Grid/list toggle, search, filters, idea cards
    IdeasPage.test.tsx
    CreateIdeaPage.tsx     # Create form with back link
    CreateIdeaPage.test.tsx
  types.ts                 # Idea, IdeaSummary, CreateIdeaInput, IdeaFilters
  index.ts
```

**Dependencies:** `@repo/shared` (schemas, types), `@repo/ui` (Button, Input, Card, Badge, Tabs, EmptyState), TanStack Query, react-hook-form

---

## feature/idea-detail/

```
feature/idea-detail/
  api/
    planning.ts            # getPlanningSection(), updatePlanningSection()
  hooks/
    useIdeaDetail.ts       # TanStack Query: single idea with tasks
    usePlanning.ts         # TanStack Query: planning section content
    useTasks.ts            # TanStack Query: task list
    useCreateTask.ts       # Mutation
    useUpdateTask.ts       # Mutation
    useDeleteTask.ts       # Mutation
    useComments.ts         # TanStack Query: comment list + mutations
  components/
    PlanningAccordion.tsx  # 5 collapsible sections
    PlanningAccordion.test.tsx
    PlanningSection.tsx    # Markdown viewer/editor per section
    PlanningSection.test.tsx
    TaskList.tsx           # Tasks grouped by milestone + progress
    TaskList.test.tsx
    TaskItem.tsx           # Checkbox + title + milestone badge
    TaskItem.test.tsx
    CommentThread.tsx      # Comment list with avatars + timestamps
    CommentThread.test.tsx
    CommentForm.tsx        # Textarea + submit
    CommentForm.test.tsx
    IdeaMeta.tsx           # Status, priority, tags, dates, actions
    IdeaMeta.test.tsx
    ImportMarkdownModal.tsx  # Drag-and-drop .md import
  pages/
    IdeaDetailPage.tsx     # Full detail layout
    IdeaDetailPage.test.tsx
  types.ts                 # PlanningSection, Task, Comment, IdeaDetail
  index.ts
```

**Dependencies:** `@repo/shared`, `@repo/ui`, `feature/ideas` (StatusBadge, PriorityDot, TagBadge), react-markdown, TanStack Query

---

## feature/roadmap/

```
feature/roadmap/
  api/
    ideas.ts               # Reuse from feature/ideas (getPipeline, updateStatus)
  hooks/
    usePipeline.ts         # TanStack Query: ideas grouped by status
  components/
    KanbanBoard.tsx        # 6-column board with @dnd-kit
    KanbanBoard.test.tsx
    KanbanColumn.tsx       # Single column (header + card list)
    KanbanColumn.test.tsx
    KanbanCard.tsx         # Draggable compact card
    KanbanCard.test.tsx
    DragOverlay.tsx        # Visual feedback during drag
  pages/
    RoadmapPage.tsx        # Full Kanban view
    RoadmapPage.test.tsx
  types.ts                 # Pipeline, PipelineColumn
  index.ts
```

**Dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable`, `feature/ideas` (StatusBadge, PriorityDot, TagBadge), TanStack Query

---

## feature/collaboration/

```
feature/collaboration/
  api/
    shares.ts              # getShares(), addShare(), updateShare(), removeShare(), getSharedWithMe()
  hooks/
    useShares.ts           # TanStack Query: share list for an idea
    useSharedWithMe.ts     # TanStack Query: ideas shared with user
    useAddShare.ts         # Mutation
    useRemoveShare.ts      # Mutation
  components/
    ShareModal.tsx         # Email invite + access list + role dropdowns
    ShareModal.test.tsx
    ShareList.tsx          # List of users with access
    InviteForm.tsx         # Email input + role selector
    AccessRoleSelect.tsx   # Owner/Edit/View dropdown
  pages/
    SharedPage.tsx         # "Shared with me" page
    SharedPage.test.tsx
  types.ts                 # Share, ShareInput, SharedIdea
  index.ts
```

**Dependencies:** `@repo/shared` (schemas), `@repo/ui` (Modal, Button, Input, Select, Badge), TanStack Query

---

## feature/notifications/

```
feature/notifications/
  api/
    notifications.ts       # getNotifications(), markRead(), markAllRead()
  hooks/
    useNotifications.ts    # TanStack Query: notifications + unread count
    useMarkRead.ts         # Mutation
    useMarkAllRead.ts      # Mutation
  components/
    NotificationBell.tsx   # Bell icon + unread badge (in header)
    NotificationBell.test.tsx
    NotificationPanel.tsx  # Dropdown panel with list
    NotificationPanel.test.tsx
    NotificationItem.tsx   # Single notification (icon, message, time)
  types.ts                 # Notification, NotificationType
  index.ts
```

**Dependencies:** `@repo/shared` (types), `@repo/ui` (Badge), TanStack Query

---

## feature/tags/

```
feature/tags/
  api/
    tags.ts                # getTags(), createTag(), updateTag(), deleteTag()
  hooks/
    useTags.ts             # TanStack Query: tag list
    useCreateTag.ts        # Mutation
    useUpdateTag.ts        # Mutation
    useDeleteTag.ts        # Mutation
  components/
    TagManager.tsx         # Tag list + create/edit/delete UI
    TagManager.test.tsx
    TagForm.tsx            # Create/edit tag form (name + color)
  pages/
    TagsPage.tsx           # Full tags management page
    TagsPage.test.tsx
  types.ts                 # Tag, CreateTagInput
  index.ts
```

**Dependencies:** `@repo/shared` (schemas), `@repo/ui` (Button, Input, Card, Modal), TanStack Query

---

## feature/settings/

```
feature/settings/
  pages/
    SettingsPage.tsx       # Profile, theme, account settings
    SettingsPage.test.tsx
  components/
    ProfileForm.tsx        # Edit name, email
    ThemeToggle.tsx        # Light/dark/system selector
  types.ts
  index.ts
```

**Dependencies:** `@repo/shared`, `@repo/ui`, Zustand store (theme)

---

## Shared Dependencies Summary

| Feature       | @repo/shared   | @repo/ui                                     | TanStack Query | Zustand        | react-hook-form | @dnd-kit |
| ------------- | -------------- | -------------------------------------------- | -------------- | -------------- | --------------- | -------- |
| auth          | schemas        | Button, Input                                | —              | —              | yes             | —        |
| dashboard     | types          | Card, Badge, ProgressBar                     | yes            | —              | —               | —        |
| ideas         | schemas, types | Button, Input, Card, Badge, Tabs, EmptyState | yes            | yes (viewMode) | yes             | —        |
| idea-detail   | schemas, types | Button, Input, Textarea, Card, Badge         | yes            | —              | yes             | —        |
| roadmap       | types          | Badge                                        | yes            | —              | —               | yes      |
| collaboration | schemas        | Modal, Button, Input, Select, Badge          | yes            | —              | yes             | —        |
| notifications | types          | Badge                                        | yes            | —              | —               | —        |
| tags          | schemas        | Button, Input, Card, Modal                   | yes            | —              | yes             | —        |
| settings      | —              | Button, Input                                | —              | yes (theme)    | yes             | —        |
