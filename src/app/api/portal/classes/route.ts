import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireCustomerAuth } from '@/lib/auth/customer-auth';
import { handleAuthError } from '@/lib/auth/permissions';

// GET /api/portal/classes?date=YYYY-MM-DD&branchId=
export async function GET(request: NextRequest) {
  try {
    const session = await requireCustomerAuth();
    const tenantId = session.user.customerTenantId;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const branchId = searchParams.get('branchId');

    // Default to today
    const date = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      branch: { tenantId },
      startTime: { gte: startOfDay, lte: endOfDay },
      isCancelled: false,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const classes = await prisma.classInstance.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        coach: {
          select: {
            id: true,
            tenantUser: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
        },
        room: { select: { name: true } },
        template: {
          select: {
            service: { select: { name: true, creditCost: true, type: true } },
          },
        },
        _count: {
          select: {
            bookings: { where: { status: 'CONFIRMED' } },
          },
        },
        bookings: {
          where: { customerId: session.user.customerId },
          select: { id: true, status: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const formattedClasses = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      startTime: cls.startTime,
      endTime: cls.endTime,
      capacity: cls.capacity,
      bookedCount: cls._count.bookings,
      availableSpots: cls.capacity - cls._count.bookings,
      branchId: cls.branch.id,
      branchName: cls.branch.name,
      coachName: cls.coach?.tenantUser?.user?.name || null,
      roomName: cls.room?.name || null,
      serviceName: cls.template?.service?.name || cls.name,
      creditCost: cls.template?.service?.creditCost || 1,
      serviceType: cls.template?.service?.type || 'GROUP_CLASS',
      isBooked: cls.bookings.length > 0 && cls.bookings[0].status !== 'CANCELLED',
      bookingId: cls.bookings.length > 0 ? cls.bookings[0].id : null,
      bookingStatus: cls.bookings.length > 0 ? cls.bookings[0].status : null,
    }));

    // Also fetch branches for the filter
    const branches = await prisma.branch.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ classes: formattedClasses, branches });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching portal classes:', error);
    return NextResponse.json({ error: '\u05D0\u05D9\u05E8\u05E2\u05D4 \u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05D4\u05E9\u05D9\u05E2\u05D5\u05E8\u05D9\u05DD' }, { status: 500 });
  }
}
