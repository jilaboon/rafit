# Phase 1: MVP Scheduling + Booking - Design Document

## Overview

Phase 1 delivers the core scheduling and booking functionality - the "heartbeat" of RAFIT. This includes admin tools for managing branches, staff, services, and classes, as well as customer-facing booking capabilities.

## Features

### Admin Features
1. **Branch Management**
   - Create/edit branches
   - Manage rooms and resources
   - Configure branch settings

2. **Staff Management**
   - Create staff profiles
   - Assign roles and branches
   - Manage coach profiles

3. **Service Configuration**
   - Define service types (group, personal, workshop)
   - Set duration, capacity, pricing
   - Configure credit costs

4. **Class Scheduling**
   - Create class templates (recurring)
   - Generate class instances
   - Manage exceptions
   - Cancel/reschedule classes

### Customer Features
1. **Browse Schedule**
   - View available classes
   - Filter by date, service, coach
   - See real-time availability

2. **Booking**
   - Book classes
   - Join waitlist
   - Cancel bookings

3. **Check-in**
   - Self check-in
   - Staff check-in
   - No-show tracking

### Notifications
- Email confirmation on booking
- Reminder before class (job queue)
- Cancellation notification
- Waitlist promotion

## API Endpoints

### Branches
```
GET    /api/branches              - List branches
POST   /api/branches              - Create branch
GET    /api/branches/:id          - Get branch
PATCH  /api/branches/:id          - Update branch
DELETE /api/branches/:id          - Delete branch
```

### Staff
```
GET    /api/staff                 - List staff
POST   /api/staff                 - Create staff profile
GET    /api/staff/:id             - Get staff profile
PATCH  /api/staff/:id             - Update staff
DELETE /api/staff/:id             - Delete staff
```

### Services
```
GET    /api/services              - List services
POST   /api/services              - Create service
GET    /api/services/:id          - Get service
PATCH  /api/services/:id          - Update service
DELETE /api/services/:id          - Delete service
```

### Classes
```
GET    /api/classes/templates     - List class templates
POST   /api/classes/templates     - Create template
GET    /api/classes/instances     - List class instances
POST   /api/classes/instances     - Create instance
PATCH  /api/classes/instances/:id - Update/cancel instance
```

### Bookings
```
GET    /api/bookings              - List bookings
POST   /api/bookings              - Create booking
GET    /api/bookings/:id          - Get booking
PATCH  /api/bookings/:id          - Update booking
DELETE /api/bookings/:id          - Cancel booking
POST   /api/bookings/:id/checkin  - Check in
POST   /api/bookings/:id/no-show  - Mark no-show
```

### Schedule
```
GET    /api/schedule              - Get schedule (public)
GET    /api/schedule/availability - Check availability
```

## UI Pages

### Admin
- `/dashboard/branches` - Branch list and management
- `/dashboard/branches/[id]` - Branch detail/edit
- `/dashboard/staff` - Staff list
- `/dashboard/staff/[id]` - Staff profile
- `/dashboard/services` - Service management
- `/dashboard/schedule` - Calendar view
- `/dashboard/schedule/templates` - Class templates
- `/dashboard/bookings` - Booking list
- `/dashboard/checkin` - Check-in screen

### Customer Portal
- `/schedule` - Browse schedule
- `/book/[classId]` - Book class
- `/my-bookings` - My bookings

## Database Changes

No schema changes - using Phase 0 models.

## Security Considerations

- All booking operations require authentication
- Tenant isolation enforced on all queries
- Capacity checks with optimistic locking
- Rate limiting on booking endpoints
- Audit logging for all booking operations

## Testing Strategy

### Unit Tests
- Booking validation
- Capacity calculation
- Waitlist ordering

### Integration Tests
- Booking flow (book, cancel, waitlist)
- Race condition handling
- Permission checks

### Load Tests
- 50 concurrent users booking same class
- Verify no overbooking
- Measure response times

## Deliverables

1. Branch management UI and API
2. Staff management UI and API
3. Service configuration UI and API
4. Class template and instance management
5. Customer schedule view
6. Booking flow with waitlist
7. Check-in functionality
8. Email notifications (job queue)
9. Attendance dashboard
10. Unit and integration tests
