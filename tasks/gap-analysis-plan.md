# Gap Analysis: Domain Expert Requirements vs Current Codebase

## Context

A domain expert provided a high-level requirements list for the gym management system (management dashboard + customer portal). We audited the entire codebase with 3 parallel agents to identify what exists, what's partial, and what's missing.

---

## Current State Summary

### Management System (מערכת ניהול)

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard (דאשבורד) | ✅ Exists | Role-based stats, today's classes, recent activity. **Missing**: customizable widgets per user |
| Lead management (ניהול לידים) | 🟡 Partial | `leadStatus` field exists on Customer model, filter in customer list. **Missing**: dedicated lead pipeline UI, lead-to-customer conversion flow |
| Customer management (ניהול לקוחות) | ✅ Exists | Full CRUD, profile page with edit, search/filter, tags |
| Service operations (פעולות שירות) | 🟡 Partial | See breakdown below |
| Schedule (לוח זמנים) | ✅ Exists | Weekly view, class templates, drag-to-create, branch filter |
| Check-in (צ'ק-אין) | ✅ Exists | Today's classes, attendee list, birthday/medical alerts |
| Reports (דוחות) | ✅ Exists | Revenue, attendance, membership, customer reports with date ranges |
| Membership plans setup | ✅ Exists | MONTHLY/ANNUAL/PUNCH_CARD/CREDITS types, pricing, credits config |
| Branches & Team | ✅ Exists | Multi-branch, staff roles (7 roles), coaches |
| Settings | ✅ Exists | Business info, operating hours, branding |
| **Shop (חנות)** | ❌ Missing | No product catalog, cart, orders, or inventory |
| **Tasks/Reminders (משימות)** | ❌ Missing | No task assignment, due dates, or reminder system |
| **SMS/WhatsApp messaging** | ❌ Missing | No messaging integration, templates, or send history |
| **Forms/Documents (טפסים)** | ❌ Missing | No form builder, health declarations, or document management |

#### Service Operations Breakdown

| Sub-feature | Status | Notes |
|-------------|--------|-------|
| Customer registration | ✅ Exists | Create customer with all fields |
| Billing / Payments | 🟡 Partial | Payment model exists, manual recording. **Missing**: invoice generation, recurring billing, payment gateway |
| Membership assignment | ✅ Exists | Assign plan to customer with dates |
| Membership switching | 🟡 Partial | Can create new membership. **Missing**: formal switch/upgrade flow with prorated billing |
| Membership freeze | ✅ Exists | `PAUSED` status on membership model |
| Class registration (booking) | ✅ Exists | Book customer into class, check-in |
| Reminders & tasks | ❌ Missing | No task/reminder system |
| Personal details edit | ✅ Exists | Customer profile edit with permission gating |
| SMS/WhatsApp messaging | ❌ Missing | No messaging |

### Customer Portal (פורטל מתאמנים)

| Feature | Status | Notes |
|---------|--------|-------|
| Home screen (מסך בית) | ✅ Exists | Upcoming classes, membership status, quick actions |
| Class registration (הרשמה לשיעורים) | ✅ Exists | Browse available classes, book/cancel |
| Booking management | ✅ Exists | View bookings, cancel upcoming |
| Membership view | ✅ Exists | Current membership details, sessions remaining |
| Profile management | ✅ Exists | View/edit personal details |
| Auth (login/register) | ✅ Exists | Invite-based onboarding, JWT isolation |
| **Shop (חנות)** | ❌ Missing | No product browsing or purchasing |
| **Training logbook (יומן אימונים)** | ❌ Missing | No workout logging, progress tracking, or history |

---

## Missing Features — Prioritized Phases

### Phase 1: Lead Pipeline & Conversion (HIGH PRIORITY)
**Why first**: Directly drives revenue — converting leads to paying customers is core business flow.

**Scope**:
1. **Lead pipeline page** (`/dashboard/leads`) — Kanban-style board with stages: NEW → CONTACTED → QUALIFIED → CONVERTED / LOST
2. **Lead-to-customer conversion** — One-click flow that changes `leadStatus` to CONVERTED, prompts to assign membership
3. **Lead source tracking** — Already have `source` field, add UI to filter/report by source
4. **Lead notes/activity log** — Timeline of interactions on lead profile

**Schema changes**: Minimal — mostly UI work. May add `LeadActivity` model for interaction logging.

**Files to modify**:
- New: `src/app/(dashboard)/dashboard/leads/page.tsx`
- New: `src/app/api/leads/` routes
- Modify: `src/app/(dashboard)/dashboard/customers/[id]/page.tsx` (conversion action)

### Phase 2: Tasks & Reminders System (HIGH PRIORITY)
**Why**: Staff need to track follow-ups, renewals, and daily operations.

**Scope**:
1. **Task model** — assignee, due date, priority, status, linked entity (customer/lead/booking)
2. **Task list page** (`/dashboard/tasks`) — filter by assignee, status, due date
3. **Dashboard widget** — show overdue/today's tasks
4. **Auto-generated reminders** — membership expiring soon, booking follow-up

**New models**: `Task`, `TaskTemplate` (for recurring patterns)

**Files**:
- New: `prisma/schema.prisma` additions (Task model)
- New: `src/app/(dashboard)/dashboard/tasks/page.tsx`
- New: `src/app/api/tasks/` routes
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (dashboard widget)

### Phase 3: Messaging (SMS/WhatsApp) (MEDIUM PRIORITY)
**Why**: Communication with customers is essential but can be done manually initially.

**Scope**:
1. **Message templates** — predefined templates with variable substitution ({firstName}, {className}, etc.)
2. **Send from customer profile** — Quick send button on customer page
3. **Bulk messaging** — Send to filtered customer list
4. **Message history** — Log of sent messages per customer
5. **Provider integration** — Twilio/MessageBird for SMS, WhatsApp Business API

**New models**: `MessageTemplate`, `MessageLog`

**Questions for domain expert**:
- Which SMS provider do they use in Israel? (e.g., 019, InforUMobile, Twilio)
- WhatsApp Business API or just WhatsApp Web links?
- Do they need automated triggers (e.g., auto-send reminder 24h before class)?

### Phase 4: Forms & Health Declarations (MEDIUM PRIORITY)
**Why**: Legal/compliance requirement for gyms, but can use external tools short-term.

**Scope**:
1. **Form builder** — Dynamic forms with field types (text, select, checkbox, signature, date)
2. **Health declaration template** — Pre-built template for new customer onboarding
3. **Form submission tracking** — Which customers completed which forms
4. **Portal integration** — Customers fill forms in their portal
5. **PDF generation** — Export completed forms

**New models**: `Form`, `FormField`, `FormSubmission`, `FormResponse`

**Questions**:
- Do they need a visual drag-and-drop form builder, or is a predefined health declaration form enough?
- Is digital signature required?
- Do forms need to be emailed as PDF?

### Phase 5: Shop / Products (LOWER PRIORITY)
**Why**: Nice-to-have but many gyms manage this separately.

**Scope**:
1. **Product catalog** — name, description, price, images, stock, categories
2. **Staff-side**: Add products, manage inventory, record sales
3. **Portal-side**: Browse products, add to cart, purchase (linked to customer account)
4. **Payment integration** — Tied to existing payment system
5. **Order management** — Order history, status tracking

**New models**: `Product`, `ProductCategory`, `Order`, `OrderItem`, `Inventory`

**Questions**:
- What kind of products? (supplements, merchandise, equipment rental?)
- Do they need real online payment, or just staff-recorded sales?
- Inventory management needed, or just a catalog?

### Phase 6: Training Logbook (LOWER PRIORITY)
**Why**: Value-add for customer retention, not core operations.

**Scope**:
1. **Workout logging** — Exercises, sets, reps, weight, duration, notes
2. **Exercise library** — Predefined exercises with categories
3. **Progress tracking** — Charts showing improvement over time
4. **Coach notes** — Coaches can add notes to customer's logbook
5. **Portal view** — Customers see their history and progress

**New models**: `Exercise`, `WorkoutLog`, `WorkoutExercise`, `BodyMeasurement`

**Questions**:
- Do coaches create workout plans, or do customers log freely?
- What metrics matter? (weight, reps, time, body measurements?)
- Is this per-class logging or general gym workout logging?

---

## Billing/Invoicing Enhancement (Cuts across phases)

The current payment system is basic (manual recording). The domain expert mentions billing as a service operation. We should enhance:
- **Invoice generation** — Auto-create invoice when membership is assigned
- **Recurring billing** — Monthly charge for active memberships
- **Payment gateway** — Israeli payment providers (Tranzila, CardCom, PayMe)
- **Receipt/invoice PDF** — Send to customer

**Question**: Which payment provider do they use? Do they need recurring auto-charge or manual recording is fine?

---

## Open Questions for Domain Expert

1. **Dashboard customization** — "דאשבורד עם אפשרות להתאמה אישית" — How customizable? Drag-and-drop widgets? Or just role-based defaults?
2. **SMS/WhatsApp provider** — Which service do they currently use for customer communication?
3. **Payment provider** — Which Israeli payment gateway? (Tranzila, CardCom, PayMe, etc.)
4. **Health declaration** — Need a full form builder or just a standard health declaration form?
5. **Shop scope** — What products are sold? Online payment or staff-recorded?
6. **Training logbook** — Coach-directed plans or customer self-logging?
7. **Membership switching** — What are the rules for switching plans? Prorated refund?

---

## Recommended Implementation Order

```
Phase 1: Lead Pipeline & Conversion .......... ~3-4 days
Phase 2: Tasks & Reminders ................... ~3-4 days
Phase 3: Messaging (SMS/WhatsApp) ............ ~4-5 days (depends on provider)
Phase 4: Forms & Health Declarations ......... ~4-5 days
Phase 5: Shop / Products .................... ~5-7 days
Phase 6: Training Logbook ................... ~4-5 days
Billing Enhancement ......................... ~3-4 days (can parallel with Phase 3+)
```

**Suggested start**: Phase 1 (leads) + Phase 2 (tasks) can be built in parallel as they're independent. Then answer the open questions to unblock Phases 3-6.

## Verification

After each phase:
1. `npm run build` — no TypeScript errors
2. `prisma db push` — schema updates applied
3. Seed data updated with demo data for new features
4. Manual testing of all new pages and flows
5. Verify existing features still work (check-in, bookings, portal)
