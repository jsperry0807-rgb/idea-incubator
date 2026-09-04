# Idea Incubator — UI Component Inventory

Reusable primitives built in `@repo/ui` and domain components in `feature/` modules.

---

## Primitives (`packages/ui/src/`)

### Button

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}
```

**Usage:** `<Button variant="primary" size="md" onClick={save}>Save</Button>`

---

### Input

```tsx
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}
```

**Usage:** `<Input label="Email" error={errors.email} icon={<MailIcon />} />`

---

### Textarea

```tsx
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rows?: number;
}
```

---

### Select

```tsx
interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}
```

---

### Modal

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}
```

**Behavior:** Backdrop click closes, Esc key closes, focus trapped inside.

---

### Card

```tsx
interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}
```

---

### Badge

```tsx
interface BadgeProps {
  variant: "default" | "success" | "warning" | "danger" | "info" | "muted";
  children: ReactNode;
  size?: "sm" | "md";
}
```

**Used for:** Status badges (Idea, Planning, Planned, In Progress, Done, Archived).

---

### Avatar

```tsx
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}
```

**Fallback:** First letter of name on colored background.

---

### Tooltip

```tsx
interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}
```

---

### Toast / Toaster

```tsx
// Trigger
toast.success("Idea created!");
toast.error("Something went wrong");
toast.info("Tip: Press / to search");

// Provider (in root layout)
<Toaster />;
```

---

### Spinner

```tsx
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}
```

---

### EmptyState

```tsx
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

---

### Dropdown

```tsx
interface DropdownProps {
  trigger: ReactNode;
  items: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    danger?: boolean;
  }[];
}
```

---

### Tabs

```tsx
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}
```

**Used for:** Status filter tabs on Ideas page.

---

### ProgressBar

```tsx
interface ProgressBarProps {
  value: number; // 0-100
  size?: "sm" | "md";
  color?: "default" | "success";
}
```

---

### ConfirmDialog

```tsx
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}
```

---

## Domain Components

### IdeaCard (feature/ideas/)

Compact card for grid view. Shows title, status badge, priority dot, tags, task progress bar.

```tsx
interface IdeaCardProps {
  idea: IdeaSummary;
  viewMode: "grid" | "list";
  onClick: () => void;
}
```

---

### IdeaListRow (feature/ideas/)

Row for list view. Shows same info as IdeaCard but in horizontal layout.

---

### StatusBadge (feature/ideas/)

Colored badge mapped to IdeaStatus:

| Status      | Color  |
| ----------- | ------ |
| IDEA        | Gray   |
| PLANNING    | Blue   |
| PLANNED     | Yellow |
| IN_PROGRESS | Orange |
| DONE        | Green  |
| ARCHIVED    | Muted  |

---

### PriorityDot (feature/ideas/)

Small colored dot mapped to IdeaPriority:

| Priority | Color       |
| -------- | ----------- |
| NONE     | Transparent |
| LOW      | Gray        |
| MEDIUM   | Yellow      |
| HIGH     | Orange      |
| CRITICAL | Red         |

---

### TagBadge (feature/ideas/)

Tag with optional color background.

---

### CreateIdeaForm (feature/ideas/)

Full form with: title, description, status radio, priority buttons, tags multi-select, planning folder preview.

---

### KanbanBoard (feature/roadmap/)

6-column horizontal scrollable board using `@dnd-kit/core`.

---

### KanbanColumn (feature/roadmap/)

Single column: header (status name + count) + droppable card list.

---

### KanbanCard (feature/roadmap/)

Compact draggable card: title, priority dot, tags, progress bar, task count text.

---

### PlanningAccordion (feature/idea-detail/)

Collapsible accordion with 5 sections: Overview, Tech Stack, Features, Timeline, Risks.

Each section shows:

- Section title
- `.md` file badge
- "Open" button (expands to show markdown content)
- Last updated timestamp

---

### PlanningSection (feature/idea-detail/)

Markdown viewer/editor for a single planning section. Toggle between view and edit mode.

---

### TaskList (feature/idea-detail/)

Tasks grouped by milestone. Each group has a progress bar. Includes "+ Add task" button.

---

### TaskItem (feature/idea-detail/)

Checkbox + title + milestone badge. Drag handle for reorder within group.

---

### CommentThread (feature/idea-detail/)

List of comments with avatars, names, timestamps, and reply/edit buttons.

---

### CommentForm (feature/idea-detail/)

Textarea + submit button for adding comments.

---

### ShareModal (feature/collaboration/)

Modal with email invite form + list of users with access + role dropdowns.

---

### NotificationBell (feature/notifications/)

Bell icon in header with unread count badge. Click opens NotificationPanel.

---

### NotificationPanel (feature/notifications/)

Dropdown panel with list of notifications. Each shows icon, message, time, read/unread state.

---

### StatsGrid (feature/dashboard/)

4-card grid showing: Total Ideas, In Planning, Planned, Done.

---

### ActivityFeed (feature/dashboard/)

List of recent actions with colored dots (blue=new, green=completed, orange=status change) and timestamps.
