import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

// GET /api/classes/today - Get today's classes for check-in
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('schedule:read');

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = {
      branch: {
        tenantId: session.user.tenantId,
      },
      startTime: {
        gte: today,
        lt: tomorrow,
      },
      isCancelled: false,
    };

    if (branchId) {
      where.branchId = branchId;
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
            status: { in: ['CONFIRMED', 'COMPLETED'] },
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
      branch: cls.branch,
      room: cls.room?.name,
      coach: cls.coach?.tenantUser?.user?.name || cls.coach?.title,
      bookings: {
        total: cls.bookings.length,
        checkedIn: cls.bookings.filter((b) => b.checkedInAt).length,
        pending: cls.bookings.filter((b) => !b.checkedInAt).length,
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
