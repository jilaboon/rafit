# RAFIT - Fitness Studio Management Platform

<div align="center">
  <h3>מערכת ניהול מתקדמת לסטודיואים ומכוני כושר</h3>
  <p>Scheduling • Memberships • CRM • Payments • Automation</p>
</div>

---

## Overview

RAFIT is a modern, multi-tenant SaaS platform designed for fitness and wellness businesses in Israel. Built with security and privacy as top priorities, it provides comprehensive tools for managing schedules, memberships, customer relationships, billing, and automation.

### Key Features

- **Scheduling**: Group classes, personal training, workshops with recurring templates
- **Booking System**: Real-time availability, waitlist management, check-in
- **Memberships**: Subscriptions, punch cards, credits, trials
- **Payments**: Stripe integration for recurring and one-time payments
- **CRM**: Lead tracking, customer profiles, segmentation, notes
- **Automation**: Email/SMS reminders, marketing campaigns
- **Reports**: Revenue, attendance, retention analytics
- **Multi-tenant**: Full tenant isolation with Row-Level Security

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js (NextAuth v5) |
| Payments | Stripe |
| State | React Query (TanStack) |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rafit.git
   cd rafit
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start infrastructure**
   ```bash
   cd docker && docker compose up -d && cd ..
   ```

5. **Set up database**
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

7. **Open in browser**
   - App: http://localhost:3000
   - MailHog (email): http://localhost:8025

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@demo.com | Demo1234! |
| Admin | admin@demo.com | Demo1234! |
| Network Manager | network@demo.com | Demo1234! |
| Coach | coach@demo.com | Demo1234! |
| Front Desk | frontdesk@demo.com | Demo1234! |

## Project Structure

```
rafit/
├── docs/                 # Documentation
│   ├── PRD.md           # Product requirements
│   ├── PHASE_*.md       # Phase design docs
│   ├── THREAT_MODEL.md  # Security threat model
│   └── RUNBOOK.md       # Operations runbook
├── docker/              # Docker configuration
├── prisma/              # Database schema & migrations
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── (auth)/     # Auth pages (login, register)
│   │   ├── (dashboard)/ # Dashboard pages
│   │   └── api/        # API routes
│   ├── components/     # React components
│   │   ├── ui/         # Base UI components (shadcn)
│   │   └── layout/     # Layout components
│   ├── lib/            # Utilities and services
│   │   ├── auth/       # Authentication
│   │   ├── db/         # Database client
│   │   ├── security/   # Security utilities
│   │   └── validations/ # Zod schemas
│   ├── hooks/          # React hooks
│   └── types/          # TypeScript types
└── tests/              # Test files
```

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm typecheck    # Run TypeScript check
pnpm test         # Run tests
pnpm test:coverage # Run tests with coverage
pnpm db:studio    # Open Prisma Studio
pnpm db:seed      # Seed database
```

### Database Commands

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Create migration
pnpm db:reset     # Reset and reseed database
```

### Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `STRIPE_SECRET_KEY` - Stripe API key
- `ENCRYPTION_KEY` - For field-level encryption

## Security

RAFIT is built with security as a top priority:

- **Multi-tenancy**: Row-Level Security (RLS) for complete tenant isolation
- **Authentication**: Secure sessions, CSRF protection, rate limiting
- **Authorization**: Role-based access control (RBAC) with fine-grained permissions
- **Encryption**: TLS in transit, field-level encryption for sensitive PII
- **Audit Logging**: Immutable logs for all critical actions
- **Privacy**: GDPR-aligned design, data minimization, retention policies

See [THREAT_MODEL.md](docs/THREAT_MODEL.md) for detailed security documentation.

## Roles & Permissions

| Role | Description |
|------|-------------|
| OWNER | Full access including billing and business deletion |
| ADMIN | Full operational access |
| REGIONAL_MANAGER | Multi-branch management and oversight |
| MANAGER | Branch-level management |
| COACH | View schedule, manage own classes |
| FRONT_DESK | Check-in, booking, basic CRM |
| ACCOUNTANT | Financial reports, read-only operations |
| READ_ONLY | View-only access |

## API Documentation

API routes follow RESTful conventions:

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `GET /api/tenants/current` - Get current tenant
- `GET /api/customers` - List customers
- `POST /api/bookings` - Create booking

All authenticated endpoints require a valid session and respect RBAC permissions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ for the Israeli fitness community</p>
</div>
