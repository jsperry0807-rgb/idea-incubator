# Full-Stack Monorepo

pnpm workspace monorepo with an `apps` + `packages` split.

```
├── 📁apps                         - things that get deployed / run standalone
│   ├── 📁client                   - React (Vite) SPA
│   └── 📁server                   - Node + Express API
├── 📁packages                     - libraries consumed by apps (not deployed)
│   ├── 📁config                   - shared tsconfig base
│   ├── 📁shared                   - shared types + utils (@repo/shared)
│   └── 📁ui                       - React UI primitives (@repo/ui)
```

## Commands

```bash
pnpm install          # install the whole workspace
pnpm dev              # run client + server in parallel
pnpm build            # build all packages
pnpm lint             # lint the client
pnpm typecheck        # typecheck the whole workspace
pnpm clean            # clean build artifacts
```

## Workspace packages

- `@repo/client` – Vite + React app. Feature-sliced structure with
  eslint-plugin-boundaries and naming conventions enforced.
- `@repo/server` – Express API. `tsx` for dev/start, `tsc` for builds.
- `@repo/shared` – API envelope/health types and pure utils shared by client & server.
- `@repo/ui` – minimal React component primitives.
- `@repo/config` – shared `tsconfig.base.json` used by packages.

## Adding a dependency

```bash
pnpm add <pkg> --filter @repo/client
# or link a workspace package
pnpm add @repo/shared --filter @repo/server
```