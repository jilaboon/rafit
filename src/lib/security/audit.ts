import prisma from '@/lib/db';
import { headers } from 'next/headers';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_change'
  | 'user.role_change'
  | 'user.invite'
  | 'user.delete'
  | 'tenant.create'
  | 'tenant.update'
  | 'tenant.delete'
  | 'branch.create'
  | 'branch.update'
  | 'branch.delete'
  | 'service.create'
  | 'service.update'
  | 'service.delete'
  | 'class.create'
  | 'class.update'
  | 'class.cancel'
  | 'class.delete'
  | 'booking.create'
  | 'booking.update'
  | 'booking.cancel'
  | 'booking.checkin'
  | 'booking.no_show'
  | 'customer.create'
  | 'customer.update'
  | 'customer.delete'
  | 'customer.export'
  | 'membership.create'
  | 'membership.update'
  | 'membership.cancel'
  | 'payment.create'
  | 'payment.refund'
  | 'automation.create'
  | 'automation.update'
  | 'automation.delete'
  | 'settings.update'
  | 'data.export'
  | 'data.delete'
  // User profile actions
  | 'user.profile_update'
  // Staff profile actions
  | 'staff.profile_create'
  | 'staff.profile_update'
  | 'staff.profile_delete'
  // Super Admin actions
  | 'admin.impersonate_start'
  | 'admin.impersonate_stop'
  | 'admin.tenant_create'
  | 'admin.tenant_update'
  | 'admin.tenant_delete'
  | 'admin.user_view';

interface AuditLogInput {
  tenantId?: string;
  userId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    // Get request context
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      'unknown';
    const userAgent = headersList.get('user-agent') || undefined;

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues ? JSON.parse(JSON.stringify(input.oldValues)) : undefined,
        newValues: input.newValues ? JSON.parse(JSON.stringify(input.newValues)) : undefined,
        ipAddress,
        userAgent,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      },
    });
  } catch (error) {
    // Audit logging should not break the main flow
    console.error('Failed to create audit log:', error);
  }
}

// Wrapper for entity mutations with automatic audit logging
export async function withAuditLog<T>(
  input: Omit<AuditLogInput, 'oldValues' | 'newValues'>,
  fetchOld: (() => Promise<Record<string, unknown> | null>) | null,
  mutation: () => Promise<T>
): Promise<T> {
  const oldValues = fetchOld ? await fetchOld() : null;

  const result = await mutation();

  const newValues = result && typeof result === 'object' ? (result as Record<string, unknown>) : null;

  await createAuditLog({
    ...input,
    oldValues: oldValues || undefined,
    newValues: newValues || undefined,
  });

  return result;
}

// Query audit logs with filters
export interface AuditLogQuery {
  tenantId?: string;
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(query: AuditLogQuery) {
  const where: Record<string, unknown> = {};

  if (query.tenantId) where.tenantId = query.tenantId;
  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = query.action;
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) (where.createdAt as Record<string, unknown>).gte = query.startDate;
    if (query.endDate) (where.createdAt as Record<string, unknown>).lte = query.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
      skip: query.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

// Hebrew action labels
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'user.login': 'התחברות',
  'user.logout': 'התנתקות',
  'user.register': 'הרשמה',
  'user.password_change': 'שינוי סיסמה',
  'user.role_change': 'שינוי תפקיד',
  'user.invite': 'הזמנת משתמש',
  'user.delete': 'מחיקת משתמש',
  'tenant.create': 'יצירת עסק',
  'tenant.update': 'עדכון עסק',
  'tenant.delete': 'מחיקת עסק',
  'branch.create': 'יצירת סניף',
  'branch.update': 'עדכון סניף',
  'branch.delete': 'מחיקת סניף',
  'service.create': 'יצירת שירות',
  'service.update': 'עדכון שירות',
  'service.delete': 'מחיקת שירות',
  'class.create': 'יצירת שיעור',
  'class.update': 'עדכון שיעור',
  'class.cancel': 'ביטול שיעור',
  'class.delete': 'מחיקת שיעור',
  'booking.create': 'הרשמה לשיעור',
  'booking.update': 'עדכון הזמנה',
  'booking.cancel': 'ביטול הרשמה',
  'booking.checkin': 'צ\'ק-אין',
  'booking.no_show': 'אי הגעה',
  'customer.create': 'יצירת לקוח',
  'customer.update': 'עדכון לקוח',
  'customer.delete': 'מחיקת לקוח',
  'customer.export': 'ייצוא נתוני לקוח',
  'membership.create': 'יצירת מנוי',
  'membership.update': 'עדכון מנוי',
  'membership.cancel': 'ביטול מנוי',
  'payment.create': 'תשלום',
  'payment.refund': 'החזר כספי',
  'automation.create': 'יצירת אוטומציה',
  'automation.update': 'עדכון אוטומציה',
  'automation.delete': 'מחיקת אוטומציה',
  'settings.update': 'עדכון הגדרות',
  'data.export': 'ייצוא נתונים',
  'data.delete': 'מחיקת נתונים',
  // User profile actions
  'user.profile_update': 'עדכון פרופיל',
  // Staff profile actions
  'staff.profile_create': 'יצירת פרופיל מדריך',
  'staff.profile_update': 'עדכון פרופיל מדריך',
  'staff.profile_delete': 'מחיקת פרופיל מדריך',
  // Super Admin actions
  'admin.impersonate_start': 'התחלת התחזות',
  'admin.impersonate_stop': 'סיום התחזות',
  'admin.tenant_create': 'יצירת עסק (מנהל על)',
  'admin.tenant_update': 'עדכון עסק (מנהל על)',
  'admin.tenant_delete': 'מחיקת עסק (מנהל על)',
  'admin.user_view': 'צפייה במשתמש (מנהל על)',
};
