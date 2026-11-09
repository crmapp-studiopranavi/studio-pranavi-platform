# Glass & Lighting Business Platform

A production-oriented platform for a custom decorative glass and lighting business.

## Applications

| App            | Path           | URL            |
| -------------- | -------------- | -------------- |
| Public website | `apps/website` | `www.[domain]` |
| CRM            | `apps/crm`     | `crm.[domain]` |

## Packages

| Package           | Path             | Purpose                                |
| ----------------- | ---------------- | -------------------------------------- |
| `@platform/ui`    | `packages/ui`    | Shared design tokens and UI components |
| `@platform/types` | `packages/types` | Supabase-generated and domain types    |

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g --allow-scripts=pnpm pnpm`)
- Supabase CLI (`npx supabase --version`)

## Quick start

### 1. Configure environment

```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start Supabase locally

```bash
npx supabase start
```

This applies all migrations and seeds the database. The local Supabase Studio is
available at http://localhost:54323.

### 4. (Re)generate TypeScript types after schema changes

```bash
npx supabase gen types typescript --local > packages/types/src/database.types.ts
```

### 5. Start development servers

```bash
# Website (http://localhost:5173)
pnpm dev:website

# CRM (http://localhost:5174)
pnpm dev:crm
```

## Commands

```bash
pnpm build          # Production builds for all apps
pnpm lint           # ESLint across all workspaces
pnpm typecheck      # TypeScript checks across all workspaces
pnpm test           # Unit and integration tests
pnpm format         # Prettier format
```

## Database

Migrations live in `supabase/migrations/`. Apply them in order — Supabase CLI
handles ordering by filename timestamp automatically.

**Never edit a migration after it has been applied to a shared database.**
Create a new migration for corrections.

## Deployment

See `docs/deployment.md` (Phase 9). Default target: Cloudflare Pages + Supabase.

## Security

- `SUPABASE_SERVICE_ROLE_KEY` must never appear in any frontend (`apps/`) source file.
- All CRM tables have Row Level Security enabled.
- Anonymous users may only read published services and portfolio content.
- Lead uploads are private; staff access them via signed URLs.
