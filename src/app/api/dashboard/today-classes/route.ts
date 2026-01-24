import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

// GET /api/dashboard/today-classes - Get today's classes
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('booking:read');
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get start and end of today in tenant's timezone
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const classes = await prisma.classInstance.findMany({
      where: {
        branch: {
          tenantId,
        },
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isCancelled: false,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        coach: {
          select: {
            id: true,
            tenantUser: {
              select: {
                user: {
                  select: {
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'WAITLISTED'] },
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
      take: limit,
    });

    // Format response
    const formattedClasses = classes.map((cls) => {
      const confirmedCount = cls.bookings.filter((b) => b.status === 'CONFIRMED').length;
      const checkedInCount = cls.bookings.filter((b) => b.checkedInAt !== null).length;
      const waitlistCount = cls.bookings.filter((b) => b.status === 'WAITLISTED').length;

      return {
        id: cls.id,
        name: cls.name,
        startTime: cls.startTime.toISOString(),
        endTime: cls.endTime.toISOString(),
        capacity: cls.capacity,
        confirmedCount,
        checkedInCount,
        waitlistCount,
        branch: cls.branch,
        room: cls.room,
        coach: cls.coach
          ? {
              id: cls.coach.id,
              name: cls.coach.tenantUser?.user?.name || 'Unknown',
              avatarUrl: cls.coach.tenantUser?.user?.avatarUrl,
            }
          : null,
      };
    });

    // Calculate summary stats
    const totalClasses = classes.length;
    const totalBookings = classes.reduce(
      (sum, cls) => sum + cls.bookings.filter((b) => b.status === 'CONFIRMED').length,
      0
    );
    const totalCheckedIn = classes.reduce(
      (sum, cls) => sum + cls.bookings.filter((b) => b.checkedInAt !== null).length,
      0
    );

    return NextResponse.json({
      classes: formattedClasses,
      summary: {
        totalClasses,
        totalBookings,
        totalCheckedIn,
        averageOccupancy: totalClasses > 0
          ? Math.round(
              (classes.reduce((sum, cls) => {
                const confirmed = cls.bookings.filter((b) => b.status === 'CONFIRMED').length;
                return sum + (confirmed / cls.capacity) * 100;
              }, 0) / totalClasses)
            )
          : 0,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching today classes:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת השיעורים' },
      { status: 500 }
    );
  }
}
