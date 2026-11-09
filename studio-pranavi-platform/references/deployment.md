# Deployment and Custom Domain

## Environments

1. Local development
2. Preview internet environment
3. Production

Preview must pass before custom-domain cutover.

## Default topology

- GitHub: source and CI/CD
- Cloudflare Pages: separate website and CRM projects
- Supabase: PostgreSQL, Auth, Storage and server operations
- `www.<domain>`: website
- `crm.<domain>`: CRM
- apex `<domain>` redirects to `www.<domain>`

Preserve another functioning provider unless migration is explicitly approved.

## Required configuration

- Separate build roots and environment variables
- HTTPS
- SPA fallback for CRM deep links
- Supabase site URL and approved redirect URLs
- Approved origins and storage rules
- Security headers
- Cache immutable hashed assets
- Do not cache authenticated/private responses
- Error monitoring without customer-sensitive payloads
- Backup, recovery and rollback procedure

## Deployment sequence

```text
Local tests
-> Production-mode builds
-> Preview deployment
-> Preview smoke and E2E
-> Production migration
-> Production provider URLs
-> DNS and custom domain
-> TLS/auth/deep-link/media smoke tests
-> Handover
```

Never run destructive reset commands against production. Never claim a URL or domain is live without opening and testing it.
