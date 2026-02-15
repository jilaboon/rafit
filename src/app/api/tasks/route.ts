import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const VALID_ENTITY_TYPES = ['customer', 'booking', 'membership', 'lead'] as const;

const createTaskSchema = z.object({
  title: z.string().min(1, 'כותרת נדרשת').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  entityType: z.enum(VALID_ENTITY_TYPES).optional(),
  entityId: z.string().uuid().optional(),
});

// Helper to get current user's tenantUser ID
async function getTenantUserId(tenantId: string, userId: string) {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { tenantId, userId },
  });
  return tenantUser?.id;
}

// Restricted roles that can only see their own tasks
const SELF_ONLY_ROLES: UserRole[] = ['COACH', 'FRONT_DESK'];

// GET /api/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('task:read');
    const tenantId = session.user.tenantId!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const dueBefore = searchParams.get('dueBefore');
    const dueAfter = searchParams.get('dueAfter');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = { tenantId };

    // For COACH and FRONT_DESK, restrict to own tasks
    const userRole = session.user.role as UserRole;
    if (SELF_ONLY_ROLES.includes(userRole)) {
      const tenantUserId = await getTenantUserId(tenantId, session.user.id);
      if (tenantUserId) {
        where.assigneeId = tenantUserId;
      }
    }

    if (status) {
      // Support comma-separated statuses
      const statuses = status.split(',').map((s) => s.trim().toUpperCase());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (priority) {
      where.priority = priority.toUpperCase();
    }

    if (assigneeId && !SELF_ONLY_ROLES.includes(userRole)) {
      where.assigneeId = assigneeId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (dueBefore) {
      where.dueDate = { ...(where.dueDate as object || {}), lte: new Date(dueBefore) };
    }

    if (dueAfter) {
      where.dueDate = { ...(where.dueDate as object || {}), gte: new Date(dueAfter) };
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    // Get assignee and creator info via TenantUser -> User
    const userIds = new Set<string>();
    for (const task of tasks) {
      if (task.assigneeId) userIds.add(task.assigneeId);
      if (task.createdById) userIds.add(task.createdById);
    }

    const tenantUsers = userIds.size > 0
      ? await prisma.tenantUser.findMany({
          where: { id: { in: Array.from(userIds) } },
          include: { user: { select: { name: true } } },
        })
      : [];

    const userNameMap = new Map(
      tenantUsers.map((tu) => [tu.id, tu.user.name])
    );

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeId ? userNameMap.get(task.assigneeId) || null : null,
      createdById: task.createdById,
      createdByName: userNameMap.get(task.createdById) || null,
      entityType: task.entityType,
      entityId: task.entityId,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json({
      tasks: formattedTasks,
      total,
      limit,
      offset,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת המשימות' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create task
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('task:create');
    const tenantId = session.user.tenantId!;

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get current user's tenantUser ID for createdById
    const tenantUserId = await getTenantUserId(tenantId, session.user.id);
    if (!tenantUserId) {
      return NextResponse.json(
        { error: 'משתמש לא נמצא בעסק' },
        { status: 403 }
      );
    }

    // Validate assigneeId belongs to same tenant
    if (data.assigneeId) {
      const assignee = await prisma.tenantUser.findFirst({
        where: { id: data.assigneeId, tenantId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: 'המשתמש המוקצה לא נמצא בעסק' },
          { status: 400 }
        );
      }
    }

    // Validate entity exists in tenant if entityType and entityId provided
    if (data.entityType && data.entityId) {
      const entityExists = await validateEntity(tenantId, data.entityType, data.entityId);
      if (!entityExists) {
        return NextResponse.json(
          { error: 'הישות המקושרת לא נמצאה' },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId || null,
        createdById: tenantUserId,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
      },
    });

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'task.create',
      entityType: 'task',
      entityId: task.id,
      newValues: {
        title: data.title,
        priority: data.priority,
        assigneeId: data.assigneeId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        task,
        message: 'המשימה נוצרה בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת המשימה' },
      { status: 500 }
    );
  }
}

async function validateEntity(
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<boolean> {
  switch (entityType) {
    case 'customer':
      return !!(await prisma.customer.findFirst({
        where: { id: entityId, tenantId, deletedAt: null },
        select: { id: true },
      }));
    case 'booking':
      return !!(await prisma.booking.findFirst({
        where: { id: entityId, customer: { tenantId } },
        select: { id: true },
      }));
    case 'membership':
      return !!(await prisma.membership.findFirst({
        where: { id: entityId, customer: { tenantId } },
        select: { id: true },
      }));
    case 'lead':
      // Leads are customers with a lead status
      return !!(await prisma.customer.findFirst({
        where: { id: entityId, tenantId, deletedAt: null },
        select: { id: true },
      }));
    default:
      return false;
  }
}
