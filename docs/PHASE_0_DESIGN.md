# Phase 0: Foundations - Design Document

## Overview

Phase 0 establishes the technical foundation for RAFIT, including repository structure, development tooling, database setup with Row-Level Security, authentication, RBAC framework, and the base UI shell.

## Architecture Decisions

### 1. Monorepo Structure
**Decision**: Single Next.js application with API routes
**Rationale**: Simpler deployment, shared types, faster iteration for MVP. Can extract services later if needed.

### 2. Database & ORM
**Decision**: PostgreSQL with Prisma ORM + Raw SQL for RLS policies
**Rationale**: Prisma provides excellent DX and type safety. RLS policies require raw SQL but provide bulletproof tenant isolation at the database level.

### 3. Authentication
**Decision**: Auth.js (NextAuth v5) with credentials + magic link
**Rationale**: Well-maintained, Next.js native, supports multiple providers. Magic link reduces password friction.

### 4. Tenant Isolation Strategy
**Decision**: Row-Level Security (RLS) with `tenant_id` on all tenant-scoped tables
**Rationale**: Database-enforced isolation is the gold standard. Even if application code has bugs, data cannot leak across tenants.

### 5. Session Strategy
**Decision**: JWT for stateless auth + database sessions for security-critical operations
**Rationale**: JWTs reduce database load for read operations. Database sessions enable immediate revocation.

### 6. RBAC Implementation
**Decision**: Role + Permission model with middleware enforcement
**Rationale**: Roles for simplicity, permissions for granularity. Middleware ensures no endpoint is unprotected.

## Database Schema (Phase 0)

### Core Tables

```
tenants
├── id (uuid, PK)
├── name (varchar)
├── slug (varchar, unique) - URL-friendly identifier
├── settings (jsonb) - tenant configuration
├── created_at, updated_at
├── deleted_at (soft delete)

users
├── id (uuid, PK)
├── email (varchar, unique)
├── email_verified_at (timestamp)
├── password_hash (varchar, nullable - for magic link users)
├── name (varchar)
├── phone (varchar, encrypted)
├── avatar_url (varchar)
├── created_at, updated_at
├── deleted_at (soft delete)

tenant_users (junction - users can belong to multiple tenants)
├── id (uuid, PK)
├── tenant_id (uuid, FK)
├── user_id (uuid, FK)
├── role (enum: OWNER, ADMIN, MANAGER, COACH, FRONT_DESK, ACCOUNTANT, READ_ONLY)
├── permissions (jsonb) - override/additional permissions
├── is_active (boolean)
├── created_at, updated_at

sessions
├── id (uuid, PK)
├── user_id (uuid, FK)
├── token (varchar, hashed)
├── expires_at (timestamp)
├── ip_address (varchar)
├── user_agent (varchar)
├── created_at

audit_logs
├── id (uuid, PK)
├── tenant_id (uuid, nullable - some actions are system-level)
├── user_id (uuid, nullable)
├── action (varchar) - e.g., "user.login", "booking.create"
├── entity_type (varchar)
├── entity_id (uuid)
├── old_values (jsonb)
├── new_values (jsonb)
├── ip_address (varchar)
├── user_agent (varchar)
├── created_at
```

### Row-Level Security Policies

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant data
CREATE POLICY tenant_isolation ON tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Similar policies for all tenant-scoped tables
```

## API Design

### Authentication Endpoints
- `POST /api/auth/register` - New user registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/verify` - Verify magic link token
- `POST /api/auth/logout` - Logout (invalidate session)
- `GET /api/auth/session` - Get current session

### Tenant Endpoints
- `POST /api/tenants` - Create new tenant (during onboarding)
- `GET /api/tenants/current` - Get current tenant details
- `PATCH /api/tenants/current` - Update tenant settings

### User Management
- `GET /api/users` - List tenant users (admin)
- `POST /api/users/invite` - Invite user to tenant
- `PATCH /api/users/:id` - Update user role/permissions
- `DELETE /api/users/:id` - Remove user from tenant

## Security Controls

### Rate Limiting
- Login: 5 attempts per 15 minutes per IP
- Registration: 3 per hour per IP
- API general: 100 requests per minute per user
- Magic link: 3 per hour per email

### CSRF Protection
- Double-submit cookie pattern
- SameSite=Strict cookies
- Origin header validation

### Session Security
- HttpOnly, Secure, SameSite=Strict cookies
- 24-hour session expiry (configurable)
- Session rotation on privilege escalation
- Concurrent session limit (5 devices)

### Headers
```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

## UI Components (Phase 0)

### Shell Components
- `AppShell` - Main layout with sidebar/header
- `AuthLayout` - Login/register pages
- `MobileNav` - Bottom navigation for mobile
- `Sidebar` - Desktop sidebar navigation
- `Header` - Top bar with user menu, notifications
- `RTLProvider` - Right-to-left text direction context

### Base Components (shadcn/ui)
- Button, Input, Form fields
- Card, Dialog, Sheet
- Table, DataTable
- Toast notifications
- Loading states

### Theme
- Primary: Deep blue (#1e40af)
- Secondary: Energetic orange (#f97316)
- Success: Green (#22c55e)
- Warning: Amber (#f59e0b)
- Error: Red (#ef4444)
- Background: Clean white/gray

## File Structure

```
rafit/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/
│   ├── PRD.md
│   ├── PHASE_0_DESIGN.md
│   ├── THREAT_MODEL.md
│   └── RUNBOOK.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   └── tenants/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── layout/
│   │   └── forms/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── security/
│   │   └── utils/
│   ├── hooks/
│   ├── types/
│   └── middleware.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

## Testing Strategy

### Unit Tests
- Permission checking functions
- Utility functions
- Form validation

### Integration Tests
- Auth flows (register, login, logout)
- Tenant creation
- RBAC enforcement

### Security Tests
- Cross-tenant access attempts
- CSRF token validation
- Rate limiting effectiveness

## Deliverables

1. ✅ Repository with all tooling configured
2. ✅ Docker Compose for local development
3. ✅ PostgreSQL + Prisma schema with RLS
4. ✅ Auth.js configuration
5. ✅ RBAC middleware and utilities
6. ✅ Audit logging system
7. ✅ Base UI shell with RTL support
8. ✅ Seed data script
9. ✅ README with setup instructions
10. ✅ Threat model document
