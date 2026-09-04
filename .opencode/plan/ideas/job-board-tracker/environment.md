# Idea Incubator — Environment Variables

## Server Variables

### Required

| Variable             | Example                                                | Description                              |
| -------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `DATABASE_URL`       | `postgresql://user:pass@localhost:5432/idea_incubator` | PostgreSQL connection string             |
| `JWT_SECRET`         | `your-256-bit-secret`                                  | Access token signing key (min 32 chars)  |
| `JWT_REFRESH_SECRET` | `your-refresh-secret-key`                              | Refresh token signing key (min 32 chars) |

### Optional

| Variable               | Default                 | Description                             |
| ---------------------- | ----------------------- | --------------------------------------- |
| `PORT`                 | `3000`                  | Server listen port                      |
| `NODE_ENV`             | `development`           | `development`, `test`, or `production`  |
| `CORS_ORIGIN`          | `http://localhost:5173` | Comma-separated allowed origins         |
| `RATE_LIMIT_MAX`       | `100`                   | Global rate limit (requests per window) |
| `RATE_LIMIT_WINDOW_MS` | `900000`                | Rate limit window (15 min in ms)        |
| `STORAGE_PATH`         | `./storage`             | Base path for markdown file storage     |

---

## Client Variables (VITE\_)

All client env vars are prefixed with `VITE_` and bundled into the client.

| Variable       | Default                 | Description          |
| -------------- | ----------------------- | -------------------- |
| `VITE_API_URL` | `http://localhost:3000` | Backend API base URL |

---

## .env File Structure

### Server (.env in apps/server/)

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/idea_incubator

# Auth
JWT_SECRET=super-secret-access-token-key-change-in-production
JWT_REFRESH_SECRET=super-secret-refresh-token-key-change-in-production

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Storage
STORAGE_PATH=./storage
```

### Client (.env in apps/client/)

```env
VITE_API_URL=http://localhost:3000
```

---

## Validation

Server validates all env vars on startup using Zod:

```ts
// apps/server/src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  STORAGE_PATH: z.string().default("./storage"),
});

export const env = envSchema.parse(process.env);
```

---

## Per-Environment Overrides

| Variable       | Development             | Test                    | Production                          |
| -------------- | ----------------------- | ----------------------- | ----------------------------------- |
| `NODE_ENV`     | `development`           | `test`                  | `production`                        |
| `DATABASE_URL` | Local PostgreSQL        | Test database           | Managed PostgreSQL (Railway/Render) |
| `JWT_SECRET`   | Dev secret (committed)  | Test secret             | Strong random secret (env var)      |
| `CORS_ORIGIN`  | `http://localhost:5173` | `http://localhost:5173` | `https://your-app.com`              |
| `STORAGE_PATH` | `./storage`             | `./storage-test`        | Persistent disk or S3               |

---

## .gitignore Rules

```
# Server
apps/server/.env
apps/server/.env.local
apps/server/.env.*.local

# Client
apps/client/.env
apps/client/.env.local
apps/client/.env.*.local

# Storage (user content - never commit)
storage/

# Prisma
apps/server/prisma/migrations/**/migration_lock.toml
```
