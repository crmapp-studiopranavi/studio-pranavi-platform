# Test and Release Standard

## Frameworks

- Vitest: TypeScript business logic
- React Testing Library: components and forms
- Playwright: browser paths and complete E2E
- Supabase SQL/local tests: schema, constraints, functions, RLS and storage
- Python unittest only for actual Python modules

## Required result labels

PASS, FAIL, BLOCKED, SKIPPED, NOT TESTED. Never count unexecuted tests as PASS.

## Phase gate

Every implementation phase runs applicable:

1. Clean install or lockfile verification
2. Format check
3. Lint
4. Typecheck
5. Unit tests
6. Database migration from empty test database
7. Constraint/RLS/storage tests
8. Integration/component tests
9. E2E tests
10. Website production build
11. CRM production build

No unresolved Critical or High defect may advance to preview or production.

## Critical test journeys

### Public website

- Published content only
- Responsive navigation and deep-link refresh
- Project/media/SEO behavior
- Quote form validation, upload and receipt
- Draft content never leaks

### Security

- Anonymous CMS/CRM denial
- Inactive user denial
- Viewer, Sales, Operations, Manager and Admin boundaries
- Private file listing/download denial
- Role escalation denial

### Business workflow

```text
Website quote
-> Lead and activity
-> Follow-up
-> Customer conversion exactly once
-> Site visit and measurements
-> Quote with known totals
-> Sent version immutable
-> Accepted quote
-> Order exactly once
-> Project and installation
-> INR 50,000 invoice
-> INR 20,000 partial payment
-> INR 30,000 final payment
-> zero balance
```

### CMS/brand

- Upload approved image
- Create draft section
- Preview
- Publish
- Verify public rendering
- Replace/retire media safely
- Change test brand setting and roll back

### CSV/XLSX

- Import synthetic 100-lead file
- Map columns
- Reject invalid rows
- Review duplicates
- Commit authorized rows
- Export filtered CSV and XLSX
- Verify row/column content and formula-injection protection

## Volume tests

Design and test for approximately:

- 20 internal users
- 10,000 leads
- 5,000 customers
- 5,000 projects
- 50,000 activities

Use pagination and indexed filters. Do not load unbounded business lists into browser memory.

## Release candidate report

Report Git commit, branch, environment, commands, PASS/FAIL/BLOCKED/SKIPPED/NOT TESTED, failed test details, security findings, build status and one recommendation: NOT READY, READY FOR PREVIEW, or READY FOR PRODUCTION.
