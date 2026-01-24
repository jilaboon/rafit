# RAFIT Operations Runbook

## Overview

This runbook provides operational procedures for running RAFIT in development and production environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Database Operations](#database-operations)
3. [Deployment](#deployment)
4. [Monitoring](#monitoring)
5. [Incident Response](#incident-response)
6. [Backup & Recovery](#backup--recovery)

---

## Local Development

### Prerequisites

```bash
# Required software
node --version    # v20+
pnpm --version    # v8+
docker --version  # v24+
```

### Starting the Development Environment

```bash
# 1. Start infrastructure
cd docker && docker compose up -d && cd ..

# 2. Verify services are running
docker compose ps

# 3. Initialize database
pnpm db:generate
pnpm db:push
pnpm db:seed

# 4. Start development server
pnpm dev
```

### Stopping the Development Environment

```bash
# Stop application (Ctrl+C in terminal)

# Stop infrastructure
cd docker && docker compose down && cd ..

# Remove volumes (WARNING: deletes data)
cd docker && docker compose down -v && cd ..
```

### Resetting Database

```bash
# Full reset with fresh seed data
pnpm db:reset

# Or manually:
cd docker && docker compose down -v && docker compose up -d && cd ..
pnpm db:push
pnpm db:seed
```

---

## Database Operations

### Connecting to Database

```bash
# Via Prisma Studio (GUI)
pnpm db:studio

# Via psql
docker exec -it rafit-postgres psql -U rafit -d rafit
```

### Running Migrations

```bash
# Development (creates migration file)
pnpm db:migrate

# Production (applies pending migrations)
pnpm db:migrate:prod
```

### Creating a Backup

```bash
# Manual backup
docker exec rafit-postgres pg_dump -U rafit rafit > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i rafit-postgres psql -U rafit rafit < backup_file.sql
```

### Common Queries

```sql
-- Check tenant count
SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL;

-- Check active users per tenant
SELECT t.name, COUNT(tu.id) as user_count
FROM tenants t
LEFT JOIN tenant_users tu ON t.id = tu.tenant_id AND tu.is_active = true
GROUP BY t.id, t.name;

-- Check recent audit logs
SELECT action, entity_type, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;

-- Check booking counts for today
SELECT ci.name, COUNT(b.id) as bookings
FROM class_instances ci
LEFT JOIN bookings b ON ci.id = b.class_instance_id AND b.status = 'CONFIRMED'
WHERE DATE(ci.start_time) = CURRENT_DATE
GROUP BY ci.id, ci.name;
```

---

## Deployment

### Environment Configuration

Required environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=<generate-with-openssl>
AUTH_URL=https://app.rafit.co.il

# Redis
REDIS_URL=redis://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Security
ENCRYPTION_KEY=<32-byte-base64>

# Monitoring
SENTRY_DSN=https://...
```

### Docker Production Build

```bash
# Build image
docker build -t rafit:latest -f docker/Dockerfile .

# Run container
docker run -d \
  --name rafit \
  -p 3000:3000 \
  --env-file .env.production \
  rafit:latest
```

### Health Check

```bash
# Check application health
curl https://app.rafit.co.il/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

### Rollback Procedure

```bash
# 1. Identify previous working version
docker images rafit --format "{{.Tag}} {{.CreatedAt}}"

# 2. Stop current container
docker stop rafit

# 3. Start previous version
docker run -d --name rafit-previous -p 3000:3000 rafit:previous-tag

# 4. Verify rollback
curl https://app.rafit.co.il/api/health

# 5. Remove failed container
docker rm rafit
```

---

## Monitoring

### Log Locations

| Log Type | Location |
|----------|----------|
| Application | stdout/stderr (Docker) |
| Database | Docker logs: `docker logs rafit-postgres` |
| Redis | Docker logs: `docker logs rafit-redis` |

### Key Metrics to Monitor

1. **Application**
   - Response time (p50, p95, p99)
   - Error rate
   - Request rate

2. **Database**
   - Connection pool utilization
   - Query latency
   - Active connections

3. **Business**
   - Bookings per hour
   - Payment success rate
   - Active sessions

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | > 1% | > 5% |
| Response time p95 | > 500ms | > 2000ms |
| DB connections | > 80% | > 95% |
| Memory usage | > 80% | > 95% |

---

## Incident Response

### Severity Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| P0 | Service down, data breach | 15 min |
| P1 | Major feature broken | 1 hour |
| P2 | Minor feature broken | 4 hours |
| P3 | Non-urgent issue | Next business day |

### Incident Checklist

#### P0/P1 Response

- [ ] Acknowledge incident
- [ ] Create incident channel/ticket
- [ ] Identify scope and impact
- [ ] Notify stakeholders
- [ ] Begin investigation
- [ ] Apply fix or workaround
- [ ] Verify resolution
- [ ] Document timeline
- [ ] Schedule post-mortem

### Common Issues

#### Database Connection Errors

```bash
# Check database status
docker exec rafit-postgres pg_isready -U rafit

# Check connection count
docker exec rafit-postgres psql -U rafit -c "SELECT count(*) FROM pg_stat_activity;"

# Restart database (if needed)
docker restart rafit-postgres
```

#### High Memory Usage

```bash
# Check container memory
docker stats rafit

# Force garbage collection (if applicable)
# Restart container
docker restart rafit
```

#### Authentication Issues

```bash
# Check session table
docker exec rafit-postgres psql -U rafit -c "SELECT count(*) FROM sessions WHERE expires > NOW();"

# Clear expired sessions
docker exec rafit-postgres psql -U rafit -c "DELETE FROM sessions WHERE expires < NOW();"
```

---

## Backup & Recovery

### Automated Backups

Production systems should have automated daily backups with:
- 30-day retention
- Geographic replication
- Encryption at rest

### Manual Backup

```bash
# Full database backup
docker exec rafit-postgres pg_dump -U rafit -F c rafit > backup.dump

# Backup specific tables
docker exec rafit-postgres pg_dump -U rafit -t customers -t payments rafit > partial_backup.sql
```

### Recovery Procedure

```bash
# 1. Stop application
docker stop rafit

# 2. Restore database
docker exec -i rafit-postgres pg_restore -U rafit -d rafit -c < backup.dump

# 3. Verify data
docker exec rafit-postgres psql -U rafit -c "SELECT count(*) FROM tenants;"

# 4. Start application
docker start rafit

# 5. Verify application
curl https://app.rafit.co.il/api/health
```

### Point-in-Time Recovery

For production, enable PostgreSQL WAL archiving for point-in-time recovery.

---

## Security Operations

### Rotate Secrets

```bash
# 1. Generate new AUTH_SECRET
openssl rand -base64 32

# 2. Update environment variable
# 3. Restart application (will invalidate all sessions)
docker restart rafit
```

### Review Audit Logs

```sql
-- Security-relevant actions in last 24 hours
SELECT * FROM audit_logs
WHERE action IN ('user.login', 'user.logout', 'user.role_change', 'payment.refund')
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Failed login patterns (check for brute force)
SELECT ip_address, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'user.login'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10;
```

### User Access Review

```sql
-- Users with elevated permissions
SELECT u.email, tu.role, t.name as tenant
FROM users u
JOIN tenant_users tu ON u.id = tu.user_id
JOIN tenants t ON tu.tenant_id = t.id
WHERE tu.role IN ('OWNER', 'ADMIN')
AND tu.is_active = true
ORDER BY t.name, tu.role;
```

---

## Maintenance Windows

### Planned Maintenance

1. Notify users 24 hours in advance
2. Enable maintenance mode (if available)
3. Perform maintenance
4. Verify functionality
5. Disable maintenance mode
6. Send completion notification

### Database Maintenance

```bash
# Vacuum and analyze
docker exec rafit-postgres psql -U rafit -c "VACUUM ANALYZE;"

# Reindex (may lock tables)
docker exec rafit-postgres psql -U rafit -c "REINDEX DATABASE rafit;"
```

---

## Contact Information

| Role | Contact |
|------|---------|
| On-call Engineer | [Oncall rotation] |
| Security Team | security@rafit.co.il |
| Database Admin | dba@rafit.co.il |

---

*Last updated: Phase 0*
