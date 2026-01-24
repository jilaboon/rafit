# RAFIT Threat Model

## Overview

This document outlines the security threat model for RAFIT, a multi-tenant fitness studio management platform. It identifies potential threats, assets, attackers, and mitigations following industry-standard practices aligned with SOC2 and GDPR requirements.

## Assets

### High-Value Assets (Critical)

1. **Customer PII**
   - Email addresses, phone numbers
   - Names, addresses, dates of birth
   - Payment information (card tokens)
   - Health-related notes (emergency contacts)

2. **Financial Data**
   - Payment transactions
   - Subscription billing data
   - Invoices and receipts
   - Revenue reports

3. **Authentication Credentials**
   - Password hashes
   - Session tokens
   - API keys
   - OAuth tokens

4. **Business Data**
   - Customer lists
   - Membership data
   - Booking history
   - Business settings

### Medium-Value Assets

5. **Operational Data**
   - Class schedules
   - Staff information
   - Audit logs
   - System configurations

## Attacker Profiles

### 1. External Attacker (Internet)
- **Motivation**: Financial gain, data theft, ransomware
- **Capabilities**: Automated scanning, common exploits, phishing
- **Access**: Public-facing endpoints only

### 2. Malicious Tenant
- **Motivation**: Access competitor data, abuse platform
- **Capabilities**: Authenticated access, API manipulation
- **Access**: Own tenant scope with valid credentials

### 3. Compromised Insider
- **Motivation**: Data theft, sabotage, financial fraud
- **Capabilities**: Valid credentials, internal knowledge
- **Access**: Varies by role (staff, admin, coach)

### 4. Nation-State Actor
- **Motivation**: Intelligence gathering, mass surveillance
- **Capabilities**: Advanced persistent threats, zero-days
- **Access**: Target supply chain, infrastructure

## Threat Categories & Mitigations

### 1. Authentication & Session Attacks

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| Credential stuffing | High | High | Rate limiting, account lockout, MFA |
| Session hijacking | Critical | Medium | HttpOnly cookies, SameSite=Strict, HTTPS only |
| Brute force | Medium | High | Rate limiting (5 attempts/15 min), CAPTCHA |
| Session fixation | High | Low | Session regeneration on login |
| Password spraying | Medium | Medium | Common password detection, MFA |

**Implementation:**
- Rate limiting: 5 login attempts per 15 minutes per IP
- Sessions: 24-hour expiry, rotation on privilege change
- Passwords: Minimum 8 chars, complexity requirements
- MFA: TOTP support (Phase 4)

### 2. Authorization Bypass

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| IDOR (tenant data) | Critical | High | RLS, tenant_id in all queries |
| Privilege escalation | Critical | Medium | Server-side RBAC checks |
| Horizontal access | High | High | Ownership verification |
| Role manipulation | Critical | Low | Server-side role validation |

**Implementation:**
- Row-Level Security at database level
- Every API route validates tenant context
- Permission checks in middleware
- Audit logging for role changes

### 3. Injection Attacks

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| SQL injection | Critical | Medium | Parameterized queries (Prisma) |
| XSS (stored) | High | Medium | Output encoding, CSP |
| XSS (reflected) | Medium | Medium | Input validation, CSP |
| Command injection | Critical | Low | No shell commands from user input |
| SSRF | High | Low | URL validation, allowlists |

**Implementation:**
- Prisma ORM prevents SQL injection by default
- React escapes output by default
- Content-Security-Policy headers
- Input validation with Zod schemas

### 4. Data Exposure

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| PII leakage | Critical | Medium | Field-level encryption, access controls |
| Credential exposure | Critical | Low | Never log secrets, secret management |
| Backup theft | High | Low | Encrypted backups, access controls |
| Log leakage | Medium | Medium | PII scrubbing in logs |

**Implementation:**
- Sensitive fields encrypted at rest
- No PII in logs (masking)
- Environment variable validation
- Secrets never in version control

### 5. Cross-Tenant Attacks

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| Data leakage | Critical | Medium | RLS, tenant context validation |
| Resource exhaustion | Medium | Medium | Per-tenant quotas |
| Shared resource abuse | Medium | Low | Isolation, rate limiting |

**Implementation:**
- PostgreSQL RLS policies
- Tenant context in all database queries
- Separate Redis namespaces per tenant
- API rate limits per tenant

### 6. Infrastructure Attacks

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| DDoS | High | Medium | WAF, rate limiting, CDN |
| Container escape | Critical | Low | Non-root containers, seccomp |
| Supply chain | Critical | Medium | Dependency scanning, lockfiles |
| DNS hijacking | Critical | Low | DNSSEC, certificate pinning |

**Implementation:**
- Deploy behind CDN/WAF
- Run as non-root user
- Regular dependency updates
- Automated vulnerability scanning

### 7. Payment Security

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| Payment fraud | High | Medium | Stripe fraud protection |
| Webhook forgery | High | Medium | Signature verification |
| Double charging | Medium | Low | Idempotency keys |
| Refund abuse | Medium | Medium | Refund limits, audit trail |

**Implementation:**
- PCI DSS handled by Stripe
- All webhooks verify signatures
- Idempotency keys for mutations
- Audit logs for all financial operations

## Security Controls Matrix

### Preventive Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| Input validation | Zod schemas | ✅ Phase 0 |
| Output encoding | React default + CSP | ✅ Phase 0 |
| HTTPS only | TLS 1.3, HSTS | ✅ Phase 0 |
| CSRF protection | SameSite + tokens | ✅ Phase 0 |
| Rate limiting | In-memory + Redis | ✅ Phase 0 |
| RLS | PostgreSQL policies | ✅ Phase 0 |
| RBAC | Role + permissions | ✅ Phase 0 |
| Password policy | Zod validation | ✅ Phase 0 |
| MFA | TOTP | 📅 Phase 4 |

### Detective Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| Audit logging | Immutable log table | ✅ Phase 0 |
| Access logs | Structured logging | ✅ Phase 0 |
| Error tracking | Sentry integration | 📅 Phase 1 |
| Anomaly detection | Rate limit alerts | 📅 Phase 4 |
| Security scanning | Dependency audit | ✅ Phase 0 |

### Corrective Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| Account lockout | Automatic after failures | ✅ Phase 0 |
| Session invalidation | On password change | ✅ Phase 0 |
| Incident response | Runbook documented | 📅 Phase 5 |
| Data deletion | Hard delete for privacy | 📅 Phase 5 |

## Compliance Alignment

### GDPR

- [x] Lawful basis for processing (consent)
- [x] Data minimization
- [x] Purpose limitation
- [ ] Right to access (DSAR) - Phase 5
- [ ] Right to erasure - Phase 5
- [x] Data breach notification (process)
- [x] Privacy by design

### SOC2

- [x] Access control
- [x] Encryption in transit
- [x] Encryption at rest
- [x] Audit logging
- [x] Incident response (documented)
- [x] Vendor management (Stripe, cloud)

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Data breach, service down | 15 minutes |
| P1 | Security vulnerability exploited | 1 hour |
| P2 | Potential security issue | 4 hours |
| P3 | Security improvement | Next sprint |

### Response Process

1. **Detection**: Monitoring alerts, user reports
2. **Triage**: Assess severity, scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore services
6. **Lessons Learned**: Post-mortem

## Security Testing

### Automated

- [ ] SAST (Static Analysis)
- [ ] DAST (Dynamic Analysis)
- [ ] Dependency scanning
- [ ] Container scanning

### Manual

- [ ] Penetration testing (annual)
- [ ] Code review (all PRs)
- [ ] Architecture review (quarterly)

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01 | Initial | Initial threat model |
