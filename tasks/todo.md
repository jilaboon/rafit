# Rafit - Engineering Cookbook Audit TODO

Audit performed 2026-02-08 against the Engineering Cookbook (BOOTSTRAP.md).
Critical items already fixed in this session (see git history).

---

## Completed (Critical)

- [x] Disable `allowDangerousEmailAccountLinking` in auth config
- [x] Gate `/api/auth/test` endpoint to development only
- [x] Replace `console.log` with conditional `authLog()` in auth flow
- [x] Make `debug` mode explicit opt-in via `AUTH_DEBUG` env var
- [x] Add startup environment validation (`src/lib/env.ts`)
- [x] Add CSRF Origin checking in Edge middleware
- [x] Add Content-Security-Policy header

---

## Should-Do (High Impact)

- [ ] **Write API route tests** for auth, bookings, payments (currently 0 route tests)
- [ ] **Fix pre-existing test setup** — `@testing-library/jest-dom` missing from package.json
- [ ] **Set up GitHub Actions CI** — run tests + lint on every PR
- [ ] **Extract service layer** from route handlers (booking logic, membership credits, Stripe calls live in routes — should be in `src/lib/services/`)
- [ ] **Replace `console.log` with structured logging** across remaining codebase (outside auth)
- [ ] **Add tenant status validation** — suspended/cancelled tenants can still operate; check `tenant.status === 'ACTIVE'` in middleware or auth helpers
- [ ] **Validate query params against enums** — e.g. `status.toUpperCase()` in customers route without enum check
- [ ] **Apply rate limiting to all write endpoints** — only auth endpoints have it currently

---

## Nice-to-Have (Polish)

- [ ] E2E tests with Playwright for critical user journeys (signup, onboard, book, pay)
- [ ] PostgreSQL Row-Level Security as defense-in-depth (currently app-level tenant isolation only)
- [ ] Centralize Hebrew error messages into an i18n module
- [ ] Add pre-commit hooks for test execution (husky installed but not configured)
- [ ] Tighten CSP by replacing `unsafe-inline`/`unsafe-eval` with nonces
- [ ] Add login attempt tracking and account lockout
- [ ] Add 2FA support for sensitive operations
- [ ] Dependency vulnerability scanning (Dependabot)
