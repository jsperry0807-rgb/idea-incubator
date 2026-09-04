# Idea Incubator — Testing Strategy

## Test Stack

| Layer              | Tool                               | Purpose                                   |
| ------------------ | ---------------------------------- | ----------------------------------------- |
| Unit / Integration | `vitest` v3+                       | Fast, Vite-native, ESM-first              |
| Component testing  | `@testing-library/react` v16+      | User-perspective tests                    |
| User events        | `@testing-library/user-event` v14+ | Simulate clicks, typing, drag             |
| API mocking        | `msw` v2+                          | Intercept network at service worker level |
| E2E                | `playwright` v1.50+                | Cross-browser (Chromium, Firefox, WebKit) |
| Backend unit tests | `vitest` same                      | Reuse config across monorepo              |

---

## What to Test

### Unit Tests (fast, high volume)

- Zod validation schemas (valid/invalid inputs)
- Utility functions (`cn`, `debounce`, `date`, `slug`)
- Zustand stores (state transitions)
- TanStack Query hooks (mocked API)

### Integration Tests (medium speed)

- Components with providers (RTL + MSW)
- API route handlers with Prisma (test database)
- Auth flow (register -> login -> refresh -> me)
- Feature module interactions

### E2E Tests (slow, critical paths only)

- Registration + login flow
- Create idea -> edit planning section -> add task
- Kanban drag-and-drop status change
- Share idea with another user
- Comment on shared idea

---

## Test Directory Structure

```
apps/client/src/
  feature/auth/
    __tests__/
      LoginForm.test.tsx
      RegisterForm.test.tsx
      ProtectedRoute.test.tsx
    api/
      __tests__/
        auth.test.ts           # API call tests with MSW

  feature/ideas/
    __tests__/
      IdeaCard.test.tsx
      IdeaFilters.test.tsx
      CreateIdeaForm.test.tsx
      IdeasPage.test.tsx

  feature/roadmap/
    __tests__/
      KanbanBoard.test.tsx
      KanbanCard.test.tsx

  stores/
    __tests__/
      ui.store.test.ts

apps/server/src/
  services/
    __tests__/
      auth.service.test.ts
      ideas.service.test.ts

  routes/
    __tests__/
      auth.routes.test.ts
      ideas.routes.test.ts

packages/shared/src/
  __tests__/
    schemas.test.ts             # Zod schema validation tests
```

---

## Vitest Configuration

```ts
// apps/client/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "dist/"],
    },
  },
});
```

```ts
// apps/client/vitest.setup.ts
import "@testing-library/jest-dom";
```

---

## MSW Setup (API Mocking)

```ts
// apps/client/src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/ideas", () => {
    return HttpResponse.json({
      data: [
        {
          id: "1",
          title: "Test Idea",
          status: "IDEA",
          priority: "NONE",
          tags: [],
        },
      ],
      meta: { page: 1, limit: 20, total: 1 },
    });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json();
    if (body.email === "test@example.com") {
      return HttpResponse.json({
        data: {
          user: { id: "1", name: "Test", email: "test@example.com" },
          accessToken: "mock-token",
        },
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),
];
```

---

## Coverage Targets

| Area                      | Target              |
| ------------------------- | ------------------- |
| Utility functions         | 100%                |
| Zod schemas               | 100%                |
| API route handlers        | 90%                 |
| UI components             | 80%                 |
| Critical user flows (E2E) | 100% of happy paths |

---

## CI Integration

```yaml
# .github/workflows/ci.yml (add test step)
- name: Test
  run: pnpm test
```

---

## Test Naming Convention

```
describe('FeatureName', () => {
  describe('ComponentOrFunction', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange, Act, Assert
    });
  });
});
```

**Examples:**

- `it('should show error message when login fails')`
- `it('should move card to next column when dragged')`
- `it('should return 404 when idea does not exist')`
