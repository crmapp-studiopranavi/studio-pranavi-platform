# Architecture and Repository Conventions

## Default stack

- Monorepo: pnpm workspaces
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Routing: React Router
- Server state: TanStack Query
- Forms: React Hook Form + Zod
- Backend: Supabase PostgreSQL, Auth, Storage, and optional Edge Functions
- Hosting: Cloudflare Pages

Adapt to an existing repository if its choices are coherent and supported.

## Boundaries

- `website` may access published content and the public lead-submission path.
- `crm` requires an authenticated session and calls only RLS-protected endpoints.
- `packages/ui` contains visual primitives without business data access.
- `packages/types` contains generated database types and stable domain types.
- Database migrations are immutable after shared deployment; create a new migration for corrections.

## Environment handling

Maintain `.env.example` without real values. Browser variables may contain only public values. Service-role keys belong in protected server or CI secret stores.

## Performance budgets

Use these as practical targets, not false guarantees:

- Avoid unoptimized original portfolio images in listing grids.
- Generate responsive image sizes and lazy-load below-the-fold media.
- Keep initial public pages lightweight; defer CRM-heavy dependencies where possible.
- Avoid loading the entire portfolio, lead table, or activity history without pagination.

## API conventions

- Validate unknown input at boundaries.
- Return stable structured errors.
- Use idempotency for operations that may be retried, especially quote-to-order conversion.
- Do not rely only on frontend validation or route guards for security.
