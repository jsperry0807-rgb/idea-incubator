# Idea Incubator — Deployment

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Vercel     │────▶│   Railway    │────▶│  PostgreSQL   │
│  (Client)     │     │  (Server)    │     │  (Railway)    │
│  React SPA    │     │  Express API │     │  Managed DB   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Railway     │
                     │  (Storage)   │
                     │  Persistent  │
                     │  Disk        │
                     └──────────────┘
```

---

## Client Deployment (Vercel)

### Setup

1. Connect GitHub repo to Vercel
2. Set root directory to `apps/client`
3. Framework preset: Vite
4. Build command: `pnpm build`
5. Output directory: `dist`

### Environment Variables

| Variable       | Value                             |
| -------------- | --------------------------------- |
| `VITE_API_URL` | `https://your-app.up.railway.app` |

### Build Configuration

- Auto-deploys on push to `main`
- Preview deployments on PRs
- Node.js 22

---

## Server Deployment (Railway)

### Setup

1. Connect GitHub repo to Railway
2. Set root directory to `apps/server`
3. Build command: `pnpm prisma generate && pnpm build`
4. Start command: `pnpm start`

### Environment Variables

| Variable             | Value                                               |
| -------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | `postgresql://...` (from Railway PostgreSQL plugin) |
| `JWT_SECRET`         | Generate with `openssl rand -base64 32`             |
| `JWT_REFRESH_SECRET` | Generate with `openssl rand -base64 32`             |
| `NODE_ENV`           | `production`                                        |
| `CORS_ORIGIN`        | `https://your-app.vercel.app`                       |
| `STORAGE_PATH`       | `/data/storage` (persistent volume)                 |

### Persistent Storage

Railway supports persistent volumes for markdown file storage:

1. Add a volume mount at `/data`
2. Set `STORAGE_PATH=/data/storage`

---

## Database (Railway PostgreSQL)

### Setup

1. Add PostgreSQL plugin in Railway
2. Railway auto-sets `DATABASE_URL`
3. Run migrations on deploy:

```bash
pnpm prisma migrate deploy
```

### Migration Strategy

- **Development:** `pnpm prisma migrate dev` (creates migration files)
- **Production:** `pnpm prisma migrate deploy` (applies pending migrations)
- **CI/CD:** Run `prisma migrate deploy` as part of deployment

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 11.24.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test # ADD THIS
      - run: pnpm build
```

Vercel auto-deploys on push to `main`. Railway auto-deploys on push to `main`.

---

## Production Checklist

- [ ] Strong JWT secrets (32+ chars, random)
- [ ] CORS origin set to production URL only
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] Database connection pooling configured
- [ ] Persistent volume mounted for file storage
- [ ] Error logging (console or service like Sentry)
- [ ] Health check endpoint working (`GET /health`)
- [ ] Prisma migrations applied
- [ ] Environment variables set (not hardcoded)
- [ ] HTTPS enforced (Vercel + Railway handle this)
- [ ] Custom domain configured (optional)

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL (Docker)
docker run -d --name pg -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16

# 3. Set up database
cd apps/server
cp .env.example .env          # Configure DATABASE_URL
pnpm prisma migrate dev
pnpm prisma db seed           # Optional: seed data

# 4. Start dev servers
pnpm dev                      # Starts both client + server
```

Client: `http://localhost:5173`
Server: `http://localhost:3000`
