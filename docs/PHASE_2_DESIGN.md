# Phase 2: Memberships + Payments - Design Document

## Overview

Phase 2 implements the revenue engine - membership plans, subscriptions, punch cards, credits, and Stripe payment integration.

## Features

### Membership Plans
1. **Plan Types**
   - Subscription (monthly/yearly recurring)
   - Punch Card (fixed sessions)
   - Credits (flexible currency)
   - Trial (limited time/sessions)
   - Drop-in (single session)

2. **Plan Configuration**
   - Price, duration, sessions
   - Billing cycle
   - Auto-renewal settings
   - Stripe Price ID

### Payment Integration (Stripe)
1. **Subscription Billing**
   - Create subscription
   - Update subscription
   - Cancel subscription
   - Handle renewals

2. **One-time Payments**
   - Punch card purchase
   - Drop-in payment
   - Product purchases

3. **Invoices & Receipts**
   - Auto-generated invoices
   - PDF export
   - Receipt emails

4. **Refunds**
   - Full/partial refunds
   - Credit to account
   - Refund tracking

### Webhooks
- Payment succeeded
- Payment failed
- Subscription created
- Subscription updated
- Subscription cancelled
- Invoice created

## API Endpoints

### Membership Plans
```
GET    /api/plans              - List plans
POST   /api/plans              - Create plan
GET    /api/plans/:id          - Get plan
PATCH  /api/plans/:id          - Update plan
DELETE /api/plans/:id          - Delete plan
```

### Memberships
```
GET    /api/memberships        - List memberships
POST   /api/memberships        - Create membership
GET    /api/memberships/:id    - Get membership
PATCH  /api/memberships/:id    - Update membership
POST   /api/memberships/:id/cancel - Cancel
POST   /api/memberships/:id/pause  - Pause
```

### Payments
```
GET    /api/payments           - List payments
POST   /api/payments           - Create payment
GET    /api/payments/:id       - Get payment
POST   /api/payments/:id/refund - Refund payment
```

### Stripe
```
POST   /api/stripe/checkout    - Create checkout session
POST   /api/stripe/portal      - Create customer portal
POST   /api/stripe/webhooks    - Webhook handler
```

## Security Considerations

- Webhook signature verification
- Idempotency keys for mutations
- PCI DSS compliance (handled by Stripe)
- Audit logging for all financial operations
- Refund authorization checks

## Deliverables

1. Membership plan management
2. Customer membership assignment
3. Stripe checkout integration
4. Webhook handlers
5. Invoice generation
6. Payment history
7. Refund processing
8. Financial reports foundation
