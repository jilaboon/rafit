import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const createClassSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().min(1).max(1000),
  waitlistLimit: z.number().int().min(0).max(100).default(10),
  coachId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
});

// GET /api/classes - List classes
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('schedule:read');

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const branchId = searchParams.get('branchId');
    const coachId = searchParams.get('coachId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {
      branch: {
        tenantId: session.user.tenantId,
      },
    };

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where.startTime = { gte: dayStart, lte: dayEnd };
    } else if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (coachId) {
      where.coachId = coachId;
    }

    const classes = await prisma.classInstance.findMany({
      where,
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
            color: true,
            tenantUser: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'WAITLISTED', 'COMPLETED'] },
          },
          select: {
            id: true,
            status: true,
            checkedInAt: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const formattedClasses = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      startTime: cls.startTime,
      endTime: cls.endTime,
      capacity: cls.capacity,
      waitlistLimit: cls.waitlistLimit,
      isCancelled: cls.isCancelled,
      cancelReason: cls.cancelReason,
      branch: cls.branch,
      room: cls.room,
      coach: cls.coach
        ? {
            id: cls.coach.id,
            name: cls.coach.tenantUser?.user?.name || cls.coach.title,
            color: cls.coach.color,
          }
        : null,
      bookings: {
        total: cls.bookings.length,
        confirmed: cls.bookings.filter((b) => b.status === 'CONFIRMED').length,
        waitlisted: cls.bookings.filter((b) => b.status === 'WAITLISTED').length,
        checkedIn: cls.bookings.filter((b) => b.checkedInAt).length,
      },
    }));

    return NextResponse.json({ classes: formattedClasses });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת השיעורים' },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create class
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('schedule:create');

    const body = await request.json();
    const parsed = createClassSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify branch belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: {
        id: data.branchId,
        tenantId: session.user.tenantId,
      },
    });

    if (!branch) {
      return NextResponse.json({ error: 'סניף לא נמצא' }, { status: 404 });
    }

    // Verify coach belongs to tenant if provided
    if (data.coachId) {
      const coach = await prisma.staffProfile.findFirst({
        where: {
          id: data.coachId,
          tenantUser: {
            tenantId: session.user.tenantId,
          },
        },
      });

      if (!coach) {
        return NextResponse.json({ error: 'מדריך לא נמצא' }, { status: 404 });
      }
    }

    const classInstance = await prisma.classInstance.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        capacity: data.capacity,
        waitlistLimit: data.waitlistLimit,
        coachId: data.coachId,
        roomId: data.roomId,
        templateId: data.templateId,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        coach: {
          select: {
            id: true,
            title: true,
            tenantUser: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'class.create',
      entityType: 'classInstance',
      entityId: classInstance.id,
      newValues: {
        name: data.name,
        startTime: data.startTime,
      },
    });

    return NextResponse.json(
      {
        success: true,
        class: classInstance,
        message: 'השיעור נוצר בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת השיעור' },
      { status: 500 }
    );
  }
}
