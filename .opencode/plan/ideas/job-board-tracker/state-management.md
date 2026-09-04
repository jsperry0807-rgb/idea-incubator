# Idea Incubator — State Management Strategy

## Decision Tree

```
Is it data from the API?           → TanStack Query
Is it shared UI state across components? → Zustand
Is it local to one component?      → useState
Is it a form?                      → React Hook Form + Zod
Is it auth (user + token)?         → React Context
```

---

## TanStack Query (Server State)

**Package:** `@tanstack/react-query` v5

**Purpose:** All data fetching, caching, background refetch, optimistic updates.

### Query Keys

```ts
// Ideas
['ideas']                          // list with filters
['ideas', { status, priority, tag, search, page, sort }]
['idea', ideaId]                   // single idea
['pipeline']                       // kanban data

// Planning
['planning', ideaId, section]      // single section content

// Tasks
['tasks', ideaId]                  // task list

// Comments
['comments', ideaId]               // comment list

// Shares
['shares', ideaId]                 // share list
['shared-with-me']                 // ideas shared with user

// Tags
['tags']                           // user's tags

// Dashboard
['dashboard', 'stats']             // aggregate stats
['dashboard', 'activity']          // recent activity

// Notifications
['notifications']                  // notification list
['notifications', 'unread-count']  // unread count for bell badge
```

### Mutations

Every create/update/delete is a mutation with:
- **Optimistic updates** where safe (Kanban drag, task checkbox, status change)
- **Invalidation** of related queries on success
- **Toast notifications** on error

```ts
// Example: Create idea mutation
export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIdeaInput) => api.post('/ideas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      toast.success('Idea created!');
    },
    onError: () => {
      toast.error('Failed to create idea');
    },
  });
}
```

---

## Zustand (Client UI State)

**Package:** `zustand` v5

**Purpose:** Shared UI state that doesn't come from the API.

### UI Store

```ts
// stores/ui.store.ts
interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // View preferences
  ideasViewMode: 'grid' | 'list';
  setIdeasViewMode: (mode: 'grid' | 'list') => void;

  // Search
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}
```

**Persistence:** Theme and view preferences persisted to localStorage via Zustand's `persist` middleware.

---

## React Context (Auth)

**Purpose:** Auth state only (user, login, logout, refresh).

**Why Context for auth but not other state?**
- Auth changes infrequently (login/logout only)
- Nearly every component needs it (layout, protected routes, header)
- No performance concerns (rare re-renders)

**Why NOT Context for ideas/dashboard/etc?**
- High-frequency updates cause unnecessary re-renders
- No built-in caching or background refetch
- TanStack Query handles all of this better

### AuthContext

```tsx
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
}
```

---

## React Hook Form (Forms)

**Package:** `react-hook-form` + `@hookform/zod`

**Purpose:** Form state management with Zod validation.

### Forms in the App

| Form | Location | Fields |
|------|----------|--------|
| Login | `feature/auth/` | email, password |
| Register | `feature/auth/` | name, email, password, confirmPassword |
| Create Idea | `feature/ideas/` | title, description, status, priority, tagIds |
| Edit Idea | `feature/ideas/` | title, description, status, priority, tagIds |
| Add Comment | `feature/idea-detail/` | content |
| Add Task | `feature/idea-detail/` | title, milestone |
| Share Idea | `feature/collaboration/` | email, role |
| Create Tag | `feature/tags/` | name, color |

### Pattern

```tsx
const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['IDEA', 'PLANNING', 'PLANNED']),
});

function CreateIdeaForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'IDEA' },
  });

  const createIdea = useCreateIdea();

  const onSubmit = (data) => createIdea.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Title" error={errors.title?.message} {...register('title')} />
      {/* ... */}
    </form>
  );
}
```

---

## Axios (HTTP Client)

**Already exists** in `apps/client/src/axios.ts`. Needs extension:

```ts
// Interceptor: attach access token from memory
axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Interceptor: handle 401 -> try refresh -> retry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(error.config);
      }
      // Refresh failed -> redirect to login
      logout();
    }
    return Promise.reject(error);
  }
);
```

**Access token storage:** In-memory JS variable (never localStorage). Set on login/refresh, cleared on logout.
