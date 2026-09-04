# Idea Incubator — Tech Stack

## Core Stack (existing monorepo)

| Layer    | Tech                                            |
| -------- | ----------------------------------------------- |
| Frontend | React 19 + Vite 8, TypeScript 6, React Router 7 |
| Backend  | Node + Express 5                                |
| i18n     | i18next (en/es/fr)                              |
| Styling  | CSS custom properties, light/dark mode          |
| Monorepo | pnpm workspaces                                 |

## New Server Dependencies

| Package              | Purpose                                                                                |
| -------------------- | -------------------------------------------------------------------------------------- |
| `prisma`             | Schema management, migrations, CLI                                                     |
| `@prisma/client`     | Database access (generated client)                                                     |
| `zod`                | Input validation + env var validation                                                  |
| `bcryptjs`           | Password hashing (bcrypt)                                                              |
| `jose`               | JWT sign/verify (not jsonwebtoken -- jose is actively maintained, standards-compliant) |
| `helmet`             | Security headers (CSP, HSTS, etc.)                                                     |
| `cors`               | CORS with explicit origin list                                                         |
| `express-rate-limit` | Rate limiting (global + per-route)                                                     |

## New Client Dependencies

| Package                                   | Purpose                                                        |
| ----------------------------------------- | -------------------------------------------------------------- |
| `@tanstack/react-query`                   | Server state management (caching, refetch, optimistic updates) |
| `zustand`                                 | Client UI state (sidebar, theme, modals)                       |
| `react-hook-form` + `@hookform/resolvers` | Form state management                                          |
| `@hookform/zod`                           | Zod resolver for react-hook-form                               |
| `@dnd-kit/core` + `@dnd-kit/sortable`     | Drag-and-drop for Kanban + task reorder                        |
| `react-markdown`                          | Render markdown planning sections                              |

## New Dev Dependencies

| Package                       | Purpose                       |
| ----------------------------- | ----------------------------- |
| `vitest`                      | Unit + integration testing    |
| `@testing-library/react`      | Component testing             |
| `@testing-library/user-event` | Simulate user interactions    |
| `msw`                         | API mocking for tests         |
| `playwright`                  | End-to-end testing            |
| `@types/bcryptjs`             | TypeScript types for bcryptjs |

## Database

PostgreSQL via Prisma.

- **Connection pooling**: Use transaction mode (pgbouncer in production)
- **Migrations**: `prisma migrate dev` (local), `prisma migrate deploy` (production)
- **Seeding**: `prisma db seed` for development data
