import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

// GET /api/dashboard/pending-checkins - Get pending check-ins for today's classes
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('booking:checkin');
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get classes starting within the next 2 hours (check-in window)
    const now = new Date();
    const checkInWindowEnd = new Date();
    checkInWindowEnd.setHours(checkInWindowEnd.getHours() + 2);

    // Also include classes that started within the last hour
    const checkInWindowStart = new Date();
    checkInWindowStart.setHours(checkInWindowStart.getHours() - 1);

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkedInAt: null,
        classInstance: {
          branch: {
            tenantId,
          },
          startTime: {
            gte: checkInWindowStart,
            lte: checkInWindowEnd,
          },
          isCancelled: false,
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
        classInstance: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        classInstance: {
          startTime: 'asc',
        },
      },
      take: limit,
    });

    // Format response
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      customer: {
        id: booking.customer.id,
        name: `${booking.customer.firstName} ${booking.customer.lastName}`,
        email: booking.customer.email,
        phone: booking.customer.phone,
      },
      classInstance: {
        id: booking.classInstance.id,
        name: booking.classInstance.name,
        startTime: booking.classInstance.startTime.toISOString(),
        branch: booking.classInstance.branch,
      },
      bookedAt: booking.bookedAt.toISOString(),
    }));

    // Calculate total pending check-ins for today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const totalPendingToday = await prisma.booking.count({
      where: {
        status: 'CONFIRMED',
        checkedInAt: null,
        classInstance: {
          branch: {
            tenantId,
          },
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isCancelled: false,
        },
      },
    });

    const totalCheckedInToday = await prisma.booking.count({
      where: {
        checkedInAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        classInstance: {
          branch: {
            tenantId,
          },
        },
      },
    });

    return NextResponse.json({
      bookings: formattedBookings,
      summary: {
        pendingNow: formattedBookings.length,
        totalPendingToday,
        totalCheckedInToday,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching pending check-ins:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הצ\'ק-אין' },
      { status: 500 }
    );
  }
}
