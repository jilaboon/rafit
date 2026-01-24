# RAFIT - Product Requirements Document

## Executive Summary

RAFIT is a modern, multi-tenant SaaS platform designed for fitness and wellness businesses in Israel. It provides comprehensive tools for scheduling, membership management, CRM, billing/payments, automation, staff management, and reporting. The platform serves both business operators (admin portal) and their customers (customer portal).

**Target Market**: Israeli fitness studios, yoga centers, Pilates studios, personal training facilities, wellness centers, and martial arts dojos.

**Language**: Hebrew (RTL) as primary, with English brand name "RAFIT" preserved.

---

## Vision & Goals

### Vision
Become the leading fitness business management platform in Israel, empowering studio owners to focus on their passion while RAFIT handles the operational complexity.

### Primary Goals
1. **Simplify Operations**: Reduce administrative overhead by 70%
2. **Increase Revenue**: Optimize booking capacity and reduce no-shows
3. **Enhance Member Experience**: Mobile-first booking in under 3 taps
4. **Ensure Compliance**: GDPR-aligned privacy, SOC2-minded security

---

## User Personas

### 1. Studio Owner (בעל העסק)
- **Goals**: Full visibility into business health, revenue, member retention
- **Pain Points**: Scattered tools, manual processes, payment collection
- **Key Features**: Dashboard, reports, multi-branch management

### 2. Studio Manager (מנהל הסטודיו)
- **Goals**: Efficient daily operations, staff coordination
- **Pain Points**: Scheduling conflicts, last-minute changes
- **Key Features**: Calendar management, staff scheduling, attendance

### 3. Coach/Instructor (מדריך)
- **Goals**: View schedule, track attendance, manage personal clients
- **Pain Points**: Unclear schedule, no visibility into bookings
- **Key Features**: Personal schedule, class roster, client notes

### 4. Front Desk Staff (צוות קבלה)
- **Goals**: Quick check-ins, handle walk-ins, answer questions
- **Pain Points**: Slow systems, multiple screens
- **Key Features**: Fast check-in, booking on behalf, payment collection

### 5. Member/Customer (מתאמן)
- **Goals**: Easy booking, clear schedule, track membership
- **Pain Points**: Phone calls to book, unclear availability
- **Key Features**: Mobile booking, membership status, class history

---

## Core Features

### 1. Multi-Tenancy & Organization
- **Tenant (Business)**: Top-level entity representing a fitness business
- **Branches/Locations**: Multiple physical locations per business
- **White-labeling ready**: Custom branding per tenant (future)

### 2. Authentication & Authorization
- **Auth Methods**: Email/password, Magic link, OAuth (Google) optional
- **RBAC Roles**:
  - `OWNER`: Full access, billing, delete business
  - `ADMIN`: Full operational access, no billing/delete
  - `MANAGER`: Branch-level management
  - `COACH`: Schedule view, own classes, client notes
  - `FRONT_DESK`: Check-in, booking, basic CRM
  - `ACCOUNTANT`: Financial reports, invoices, read-only operations
  - `READ_ONLY`: View-only access for auditors

### 3. Scheduling & Calendar
- **Class Types**: Group classes, 1:1 sessions, workshops, events
- **Recurring Templates**: Weekly patterns with exceptions
- **Capacity Management**: Max participants, waitlist
- **Resources**: Rooms, equipment booking
- **Coach Assignment**: Primary + substitute coaches

### 4. Booking System
- **Customer Booking**: Browse, filter, book, cancel
- **Booking Rules**: Advance booking window, cancellation policy
- **Waitlist**: Auto-promotion when spots open
- **No-Show Tracking**: Mark and apply penalties
- **Check-In**: QR code, manual, self-service kiosk mode

### 5. Memberships & Packages
- **Subscription Plans**: Monthly/annual recurring billing
- **Punch Cards**: Fixed number of sessions
- **Credits System**: Flexible credit-based booking
- **Trial Passes**: Time-limited or session-limited trials
- **Drop-In**: Single session purchase
- **Family Plans**: Linked accounts with shared benefits

### 6. Payments & Billing
- **Payment Processor**: Stripe (cards, Apple Pay, Google Pay)
- **Billing Types**: Recurring subscriptions, one-time, invoices
- **Dunning**: Failed payment retry logic
- **Refunds**: Full/partial, credit to account
- **Invoices**: Auto-generated, PDF export
- **Tax/VAT**: Configurable rates, compliance ready

### 7. CRM & Communications
- **Lead Pipeline**: Prospect → Trial → Member stages
- **Customer Profiles**: History, preferences, notes
- **Tagging & Segmentation**: Custom tags, smart filters
- **Communication**: Email, SMS, in-app notifications
- **Consent Management**: Opt-in/out, preference center

### 8. Automations
- **Triggers**: Booking, cancellation, no-show, payment, birthday, churn risk
- **Actions**: Send email/SMS, create task, apply tag, notify staff
- **Templates**: Pre-built automation recipes
- **Scheduling**: Immediate or delayed execution

### 9. Reporting & Analytics
- **Revenue Reports**: Daily/weekly/monthly, by service/coach
- **Attendance Reports**: Utilization, peak times, trends
- **Member Reports**: Retention, churn, cohort analysis
- **Coach Reports**: Utilization, ratings, payroll data
- **Export**: CSV, PDF for all reports

### 10. Staff Management
- **Staff Profiles**: Bio, certifications, availability
- **Scheduling**: Shift management, availability blocks
- **Permissions**: Role-based access per branch
- **Payroll Integration**: Hours tracking, commission calculation

---

## Technical Requirements

### Performance
- Page load: < 2 seconds on 4G mobile
- Booking transaction: < 500ms
- Real-time updates for calendar changes
- Support 1000 concurrent users per tenant

### Security
- TLS 1.3 for all connections
- Row-Level Security for tenant isolation
- OWASP Top 10 mitigations
- Immutable audit logs
- Field-level encryption for sensitive PII
- Rate limiting on all endpoints
- CSRF protection

### Privacy & Compliance
- GDPR-aligned data handling
- Data Subject Access Requests (DSAR)
- Right to erasure implementation
- Consent logging
- Data retention policies
- Privacy by design

### Availability
- 99.9% uptime SLA target
- Graceful degradation
- Database backups: hourly, 30-day retention
- Disaster recovery plan

---

## Phased Roadmap

### Phase 0: Foundations (Week 1-2)
- Repository setup, tooling, CI/CD
- Database schema, migrations, RLS
- Authentication, session management
- RBAC framework
- Audit logging foundation
- Base UI shell with RTL support

### Phase 1: MVP Scheduling (Week 3-4)
- Branch & staff management
- Service & class configuration
- Calendar with recurring classes
- Customer registration & booking
- Check-in system
- Email notifications

### Phase 2: Payments (Week 5-6)
- Membership plans & packages
- Stripe integration
- Subscription billing
- Invoices & receipts
- Refund handling

### Phase 3: CRM & Automation (Week 7-8)
- Lead pipeline
- Customer segmentation
- Automation engine
- Email/SMS campaigns
- Communication center

### Phase 4: Advanced Features (Week 9-10)
- Multi-branch analytics
- Coach utilization
- Advanced waitlist
- Performance optimization
- MFA support

### Phase 5: Enterprise (Week 11-12)
- SSO/SAML
- Custom roles
- DSAR tooling
- Compliance documentation
- Incident response

---

## Success Metrics

### Business Metrics
- Monthly Active Tenants
- Gross Merchandise Value (GMV)
- Customer Lifetime Value (CLTV)
- Churn Rate

### Product Metrics
- Booking completion rate > 95%
- Mobile traffic share > 70%
- Average booking time < 30 seconds
- NPS > 50

### Technical Metrics
- API response time p95 < 200ms
- Error rate < 0.1%
- Uptime > 99.9%
- Security incidents: 0

---

## Appendix

### Glossary
- **Tenant**: A fitness business using RAFIT
- **Branch**: A physical location of a tenant
- **Class**: A scheduled group fitness session
- **Session**: A 1:1 appointment or private training
- **Punch Card**: Pre-paid package of sessions
- **Credits**: Flexible currency for booking different services

### Assumptions
1. Primary market is Israel (Hebrew, ILS currency, Israel timezone)
2. Stripe is available and sufficient for Israeli market
3. Users have smartphones with mobile data
4. Studios operate 6am-10pm typical hours

### Out of Scope (v1)
- Native mobile apps (PWA only)
- Video streaming / virtual classes
- E-commerce / retail POS
- Equipment inventory management
- Multi-currency support
