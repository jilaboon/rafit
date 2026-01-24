import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateBranchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/branches/:id - Get single branch
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('branch:read');
    const { id } = await params;

    const branch = await prisma.branch.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        rooms: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            staffProfiles: true,
            classInstances: {
              where: {
                startTime: { gte: new Date() },
                isCancelled: false,
              },
            },
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: 'סניף לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({
      branch: {
        ...branch,
        staffCount: branch._count.staffProfiles,
        upcomingClassesCount: branch._count.classInstances,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הסניף' },
      { status: 500 }
    );
  }
}

// PATCH /api/branches/:id - Update branch
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('branch:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateBranchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.branch.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'סניף לא נמצא' }, { status: 404 });
    }

    const data = parsed.data;

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'branch.update',
      entityType: 'branch',
      entityId: id,
      oldValues: {
        name: existing.name,
        address: existing.address,
        isActive: existing.isActive,
      },
      newValues: data,
    });

    return NextResponse.json({
      success: true,
      branch,
      message: 'הסניף עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון הסניף' },
      { status: 500 }
    );
  }
}

// DELETE /api/branches/:id - Delete branch (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('branch:delete');
    const { id } = await params;

    const existing = await prisma.branch.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            classInstances: {
              where: {
                startTime: { gte: new Date() },
                isCancelled: false,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'סניף לא נמצא' }, { status: 404 });
    }

    // Prevent deletion if there are upcoming classes
    if (existing._count.classInstances > 0) {
      return NextResponse.json(
        { error: `לא ניתן למחוק סניף עם ${existing._count.classInstances} שיעורים עתידיים. בטל את השיעורים קודם.` },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.branch.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'branch.delete',
      entityType: 'branch',
      entityId: id,
      oldValues: {
        name: existing.name,
        city: existing.city,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'הסניף נמחק בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה במחיקת הסניף' },
      { status: 500 }
    );
  }
}
