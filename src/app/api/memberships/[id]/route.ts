import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateMembershipSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED']).optional(),
  endDate: z.string().optional(),
  autoRenew: z.boolean().optional(),
  sessionsRemaining: z.number().int().min(0).optional(),
  creditsRemaining: z.number().int().min(0).optional(),
});

// GET /api/memberships/:id - Get single membership
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('membership:read');
    const { id } = await params;

    const membership = await prisma.membership.findFirst({
      where: {
        id,
        customer: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        plan: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'מנוי לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({
      membership: {
        ...membership,
        plan: {
          ...membership.plan,
          price: Number(membership.plan.price),
        },
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching membership:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת המנוי' },
      { status: 500 }
    );
  }
}

// PATCH /api/memberships/:id - Update membership
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('membership:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateMembershipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.membership.findFirst({
      where: {
        id,
        customer: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        plan: {
          select: { name: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'מנוי לא נמצא' }, { status: 404 });
    }

    const data = parsed.data;

    const membership = await prisma.membership.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.autoRenew !== undefined && { autoRenew: data.autoRenew }),
        ...(data.sessionsRemaining !== undefined && { sessionsRemaining: data.sessionsRemaining }),
        ...(data.creditsRemaining !== undefined && { creditsRemaining: data.creditsRemaining }),
        ...(data.status === 'CANCELLED' && { cancelledAt: new Date() }),
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'membership.update',
      entityType: 'membership',
      entityId: id,
      oldValues: {
        status: existing.status,
        customerName: `${existing.customer.firstName} ${existing.customer.lastName}`,
        planName: existing.plan.name,
      },
      newValues: data,
    });

    return NextResponse.json({
      success: true,
      membership,
      message: 'המנוי עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating membership:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון המנוי' },
      { status: 500 }
    );
  }
}

// DELETE /api/memberships/:id - Cancel membership
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('membership:cancel');
    const { id } = await params;

    const existing = await prisma.membership.findFirst({
      where: {
        id,
        customer: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        plan: {
          select: { name: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'מנוי לא נמצא' }, { status: 404 });
    }

    await prisma.membership.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'membership.cancel',
      entityType: 'membership',
      entityId: id,
      oldValues: {
        status: existing.status,
        customerName: `${existing.customer.firstName} ${existing.customer.lastName}`,
        planName: existing.plan.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'המנוי בוטל בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error cancelling membership:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בביטול המנוי' },
      { status: 500 }
    );
  }
}
