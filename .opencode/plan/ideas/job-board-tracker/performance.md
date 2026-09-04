# Idea Incubator — Performance

## Bundle Size Targets

| Bundle                   | Target  | Notes                           |
| ------------------------ | ------- | ------------------------------- |
| Initial JS (gzipped)     | < 150KB | Main chunk + critical path      |
| Total JS (gzipped)       | < 400KB | All lazy-loaded chunks combined |
| CSS (gzipped)            | < 30KB  | Global + component styles       |
| First Contentful Paint   | < 1.5s  | On fast 3G                      |
| Largest Contentful Paint | < 2.5s  | On fast 3G                      |
| Time to Interactive      | < 3.5s  | On fast 3G                      |

---

## Code Splitting (Already Configured)

React Router lazy loading is already in place:

```tsx
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const IdeasPage = React.lazy(() => import("./pages/IdeasPage"));
// ...
```

**Each feature module is a separate chunk** loaded on demand.

### Route-Level Splitting

| Route                 | Chunk           | Loaded When                      |
| --------------------- | --------------- | -------------------------------- |
| `/login`, `/register` | `auth`          | Visiting auth pages              |
| `/dashboard`          | `dashboard`     | Visiting dashboard               |
| `/ideas`              | `ideas`         | Visiting ideas list              |
| `/ideas/new`          | `ideas`         | Creating idea (shared with list) |
| `/ideas/:id`          | `idea-detail`   | Viewing idea detail              |
| `/roadmap`            | `roadmap`       | Visiting Kanban board            |
| `/shared`             | `collaboration` | Viewing shared ideas             |
| `/tags`               | `tags`          | Managing tags                    |
| `/settings`           | `settings`      | Settings page                    |

---

## TanStack Query Caching

### Stale-While-Revalidate

```ts
// Default: staleTime = 0, cacheTime = 5 minutes
// Customize per query:

// Ideas list: refetch on window focus
useQuery({
  queryKey: ["ideas", filters],
  queryFn: () => fetchIdeas(filters),
  staleTime: 30_000, // 30 seconds
});

// Tags: rarely change, cache longer
useQuery({
  queryKey: ["tags"],
  queryFn: fetchTags,
  staleTime: 5 * 60_000, // 5 minutes
});

// Pipeline: moderate cache
useQuery({
  queryKey: ["pipeline"],
  queryFn: fetchPipeline,
  staleTime: 60_000, // 1 minute
});
```

### Prefetching

```ts
// Prefetch idea detail on card hover
const queryClient = useQueryClient();

<IdeaCard
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['idea', idea.id],
      queryFn: () => fetchIdea(idea.id),
      staleTime: 30_000,
    });
  }}
/>
```

### Optimistic Updates (Kanban)

```ts
// Move idea to new status instantly, rollback on error
useMutation({
  mutationFn: ({ id, status }) => patchIdeaStatus(id, status),
  onMutate: async ({ id, status }) => {
    await queryClient.cancelQueries({ queryKey: ["pipeline"] });
    const previous = queryClient.getQueryData(["pipeline"]);
    queryClient.setQueryData(["pipeline"], (old) =>
      moveToStatus(old, id, status),
    );
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(["pipeline"], context.previous);
    toast.error("Failed to move idea");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["pipeline"] });
  },
});
```

---

## Image Optimization

- No user-uploaded images in MVP (markdown only)
- Future: use `<img loading="lazy">` for any images
- Use WebP format where possible
- Responsive images with `srcset` for avatars

---

## CSS Performance

- CSS custom properties for theming (no runtime CSS-in-JS)
- No CSS animations on layout properties (use `transform` and `opacity`)
- `will-change` on draggable elements during drag
- Reduce layout thrashing: batch DOM reads/writes

---

## API Performance

### Database Indexes

Already defined in Prisma schema:

```prisma
@@index([userId, status])           // Ideas filtered by user + status
@@index([userId, createdAt(sort: Desc)])  // Ideas sorted by date
@@index([ideaId, sortOrder])          // Tasks ordered per idea
@@index([ideaId, createdAt(sort: Desc)])  // Comments ordered per idea
@@index([userId, read, createdAt(sort: Desc)])  // Notifications filtered
@@index([userId])                     // Refresh tokens by user
```

### Query Optimization

- Use `select` to fetch only needed fields (avoid `include` where possible)
- Paginate all list endpoints (max 50 per page)
- Use `Promise.all` for parallel independent queries
- Avoid N+1 queries (use `include` or joins)

### Response Compression

```ts
import compression from "compression";
app.use(compression()); // Gzip responses in production
```

---

## Lazy Loading Beyond Routes

```tsx
// Lazy load heavy components (Recharts, Markdown editor)
const RechartsBar = React.lazy(() => import("./components/StatsChart"));
const MarkdownEditor = React.lazy(() => import("./components/MarkdownEditor"));
```

---

## Performance Monitoring

- Lighthouse CI in GitHub Actions (optional)
- Core Web Vitals tracking (optional: web-vitals library)
- Server response time logging (optional: morgan middleware)
