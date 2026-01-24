import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['GROUP_CLASS', 'PERSONAL', 'WORKSHOP', 'COURSE']).optional(),
  duration: z.number().int().min(5).max(480).optional(),
  defaultCapacity: z.number().int().min(1).max(1000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  creditCost: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/services/:id - Get single service
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('service:read');
    const { id } = await params;

    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        classTemplates: {
          where: { isActive: true },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            coach: {
              select: {
                id: true,
                title: true,
                tenantUser: {
                  include: {
                    user: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'שירות לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({
      service: {
        ...service,
        price: service.price ? Number(service.price) : null,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת השירות' },
      { status: 500 }
    );
  }
}

// PATCH /api/services/:id - Update service
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('service:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.service.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'שירות לא נמצא' }, { status: 404 });
    }

    const data = parsed.data;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.defaultCapacity !== undefined && { defaultCapacity: data.defaultCapacity }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.creditCost !== undefined && { creditCost: data.creditCost }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'service.update',
      entityType: 'service',
      entityId: id,
      oldValues: {
        name: existing.name,
        isActive: existing.isActive,
      },
      newValues: data,
    });

    return NextResponse.json({
      success: true,
      service: {
        ...service,
        price: service.price ? Number(service.price) : null,
      },
      message: 'השירות עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון השירות' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/:id - Soft delete service
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('service:delete');
    const { id } = await params;

    const existing = await prisma.service.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'שירות לא נמצא' }, { status: 404 });
    }

    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'service.delete',
      entityType: 'service',
      entityId: id,
      oldValues: {
        name: existing.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'השירות נמחק בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה במחיקת השירות' },
      { status: 500 }
    );
  }
}
