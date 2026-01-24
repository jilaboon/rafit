import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  capacity: z.number().int().min(1).max(1000).optional(),
  waitlistLimit: z.number().int().min(0).max(100).optional(),
  coachId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
});

const cancelClassSchema = z.object({
  cancelReason: z.string().optional(),
});

// GET /api/classes/:id - Get single class
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('schedule:read');
    const { id } = await params;

    const classInstance = await prisma.classInstance.findFirst({
      where: {
        id,
        branch: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        coach: {
          select: {
            id: true,
            title: true,
            color: true,
            tenantUser: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
        room: {
          select: { id: true, name: true },
        },
        bookings: {
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
          },
          orderBy: { bookedAt: 'asc' },
        },
      },
    });

    if (!classInstance) {
      return NextResponse.json({ error: 'שיעור לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({
      class: {
        ...classInstance,
        coach: classInstance.coach
          ? {
              id: classInstance.coach.id,
              name:
                classInstance.coach.tenantUser?.user?.name ||
                classInstance.coach.title,
              color: classInstance.coach.color,
            }
          : null,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת השיעור' },
      { status: 500 }
    );
  }
}

// PATCH /api/classes/:id - Update class
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('schedule:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateClassSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.classInstance.findFirst({
      where: {
        id,
        branch: {
          tenantId: session.user.tenantId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'שיעור לא נמצא' }, { status: 404 });
    }

    const data = parsed.data;

    const classInstance = await prisma.classInstance.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startTime !== undefined && { startTime: new Date(data.startTime) }),
        ...(data.endTime !== undefined && { endTime: new Date(data.endTime) }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.waitlistLimit !== undefined && { waitlistLimit: data.waitlistLimit }),
        ...(data.coachId !== undefined && { coachId: data.coachId }),
        ...(data.roomId !== undefined && { roomId: data.roomId }),
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'class.update',
      entityType: 'classInstance',
      entityId: id,
      oldValues: {
        name: existing.name,
        startTime: existing.startTime.toISOString(),
      },
      newValues: data,
    });

    return NextResponse.json({
      success: true,
      class: classInstance,
      message: 'השיעור עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון השיעור' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/:id - Cancel/delete class
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('schedule:cancel');
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const parsed = cancelClassSchema.safeParse(body);
    const cancelReason = parsed.success ? parsed.data.cancelReason : undefined;

    const existing = await prisma.classInstance.findFirst({
      where: {
        id,
        branch: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'WAITLISTED'] },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'שיעור לא נמצא' }, { status: 404 });
    }

    // Cancel the class (soft delete)
    await prisma.classInstance.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelReason,
      },
    });

    // Cancel all bookings
    if (existing.bookings.length > 0) {
      await prisma.booking.updateMany({
        where: {
          classInstanceId: id,
          status: { in: ['CONFIRMED', 'WAITLISTED'] },
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: 'השיעור בוטל',
        },
      });
    }

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'class.cancel',
      entityType: 'classInstance',
      entityId: id,
      oldValues: {
        name: existing.name,
        bookingsCount: existing.bookings.length,
      },
      newValues: {
        cancelReason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `השיעור בוטל${existing.bookings.length > 0 ? ` ו-${existing.bookings.length} הזמנות בוטלו` : ''}`,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error cancelling class:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בביטול השיעור' },
      { status: 500 }
    );
  }
}
