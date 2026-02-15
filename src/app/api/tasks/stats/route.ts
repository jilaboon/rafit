import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

const SELF_ONLY_ROLES: UserRole[] = ['COACH', 'FRONT_DESK'];

async function getTenantUserId(tenantId: string, userId: string) {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { tenantId, userId },
  });
  return tenantUser?.id;
}

// GET /api/tasks/stats - Task statistics for dashboard
export async function GET() {
  try {
    const session = await requirePermission('task:read');
    const tenantId = session.user.tenantId!;

    const baseWhere: Record<string, unknown> = { tenantId };

    // For COACH/FRONT_DESK, scope stats to own tasks
    const userRole = session.user.role as UserRole;
    if (SELF_ONLY_ROLES.includes(userRole)) {
      const tenantUserId = await getTenantUserId(tenantId, session.user.id);
      if (tenantUserId) {
        baseWhere.assigneeId = tenantUserId;
      }
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get tenantUserId for myPendingCount
    const tenantUserId = await getTenantUserId(tenantId, session.user.id);

    const [overdueCount, dueTodayCount, inProgressCount, myPendingCount] = await Promise.all([
      // Overdue: PENDING or IN_PROGRESS with dueDate < today
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: todayStart },
        },
      }),
      // Due today
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      // In progress
      prisma.task.count({
        where: {
          ...baseWhere,
          status: 'IN_PROGRESS',
        },
      }),
      // My pending tasks
      tenantUserId
        ? prisma.task.count({
            where: {
              tenantId,
              assigneeId: tenantUserId,
              status: 'PENDING',
            },
          })
        : 0,
    ]);

    return NextResponse.json({
      overdueCount,
      dueTodayCount,
      inProgressCount,
      myPendingCount,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הסטטיסטיקה' },
      { status: 500 }
    );
  }
}
