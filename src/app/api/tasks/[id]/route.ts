import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
});

async function getTenantUserId(tenantId: string, userId: string) {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { tenantId, userId },
  });
  return tenantUser?.id;
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('task:update');
    const tenantId = session.user.tenantId!;
    const { id } = await params;

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Fetch existing task
    const existingTask = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'המשימה לא נמצאה' },
        { status: 404 }
      );
    }

    // Role-based restrictions
    const userRole = session.user.role as UserRole;
    const tenantUserId = await getTenantUserId(tenantId, session.user.id);

    if (userRole === 'FRONT_DESK') {
      // FRONT_DESK can only update tasks assigned to them
      if (existingTask.assigneeId !== tenantUserId) {
        return NextResponse.json(
          { error: 'אין הרשאה לעדכן משימה זו' },
          { status: 403 }
        );
      }
    }

    if (userRole === 'COACH') {
      // COACH can only update status of tasks assigned to them
      if (existingTask.assigneeId !== tenantUserId) {
        return NextResponse.json(
          { error: 'אין הרשאה לעדכן משימה זו' },
          { status: 403 }
        );
      }
      // Only allow status changes
      const data = parsed.data;
      const nonStatusFields = Object.keys(data).filter((k) => k !== 'status');
      if (nonStatusFields.length > 0) {
        return NextResponse.json(
          { error: 'מותר לעדכן סטטוס בלבד' },
          { status: 403 }
        );
      }
    }

    const data = parsed.data;

    // Validate assigneeId if provided
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

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Handle status changes with completedAt logic
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (data.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
        updateData.completedAt = null;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Audit log for status changes
    if (data.status && data.status !== existingTask.status) {
      await createAuditLog({
        tenantId,
        userId: session.user.id,
        action: 'task.status_change',
        entityType: 'task',
        entityId: task.id,
        oldValues: { status: existingTask.status },
        newValues: { status: data.status },
      });
    } else if (Object.keys(updateData).length > 0) {
      await createAuditLog({
        tenantId,
        userId: session.user.id,
        action: 'task.update',
        entityType: 'task',
        entityId: task.id,
      });
    }

    return NextResponse.json({
      success: true,
      task,
      message: 'המשימה עודכנה בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון המשימה' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Cancel task (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('task:delete');
    const tenantId = session.user.tenantId!;
    const { id } = await params;

    const existingTask = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'המשימה לא נמצאה' },
        { status: 404 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'task.delete',
      entityType: 'task',
      entityId: task.id,
      oldValues: { status: existingTask.status },
      newValues: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      task,
      message: 'המשימה בוטלה בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בביטול המשימה' },
      { status: 500 }
    );
  }
}
