import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireCustomerAuth } from '@/lib/auth/customer-auth';
import { handleAuthError } from '@/lib/auth/permissions';

const createBookingSchema = z.object({
  classInstanceId: z.string().uuid(),
});

// GET /api/portal/bookings?status=upcoming|past
export async function GET(request: NextRequest) {
  try {
    const session = await requireCustomerAuth();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'upcoming';
    const now = new Date();

    const where: Record<string, unknown> = {
      customerId: session.user.customerId,
    };

    if (statusFilter === 'upcoming') {
      where.classInstance = { startTime: { gte: now } };
      where.status = { in: ['CONFIRMED', 'WAITLISTED'] };
    } else {
      where.OR = [
        { classInstance: { startTime: { lt: now } } },
        { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        classInstance: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            branch: { select: { name: true } },
            coach: {
              select: {
                tenantUser: {
                  select: { user: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: {
        classInstance: { startTime: statusFilter === 'upcoming' ? 'asc' : 'desc' },
      },
      take: 50,
    });

    const formattedBookings = bookings.map((b) => ({
      id: b.id,
      status: b.status,
      bookedAt: b.bookedAt,
      cancelledAt: b.cancelledAt,
      waitlistPosition: b.waitlistPosition,
      classInstance: {
        id: b.classInstance.id,
        name: b.classInstance.name,
        startTime: b.classInstance.startTime,
        endTime: b.classInstance.endTime,
        branchName: b.classInstance.branch.name,
        coachName: b.classInstance.coach?.tenantUser?.user?.name || null,
      },
    }));

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching portal bookings:', error);
    return NextResponse.json({ error: '\u05D0\u05D9\u05E8\u05E2\u05D4 \u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D8\u05E2\u05D9\u05E0\u05EA \u05D4\u05D4\u05D6\u05DE\u05E0\u05D5\u05EA' }, { status: 500 });
  }
}

// POST /api/portal/bookings - Book a class
export async function POST(request: NextRequest) {
  try {
    const session = await requireCustomerAuth();
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D9\u05DD', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { classInstanceId } = parsed.data;
    const customerId = session.user.customerId;
    const tenantId = session.user.customerTenantId;

    const result = await prisma.$transaction(async (tx) => {
      // Verify class belongs to customer's tenant and is in the future
      const classInstance = await tx.classInstance.findFirst({
        where: {
          id: classInstanceId,
          branch: { tenantId },
          isCancelled: false,
          startTime: { gt: new Date() },
        },
        include: {
          template: {
            select: { service: { select: { creditCost: true } } },
          },
          bookings: {
            where: { status: { in: ['CONFIRMED', 'WAITLISTED'] } },
          },
        },
      });

      if (!classInstance) {
        throw new Error('CLASS_NOT_FOUND');
      }

      // Check for existing booking
      const existingBooking = await tx.booking.findUnique({
        where: {
          customerId_classInstanceId: { customerId, classInstanceId },
        },
      });

      if (existingBooking && existingBooking.status !== 'CANCELLED') {
        throw new Error('ALREADY_BOOKED');
      }

      // Check active membership
      const activeMembership = await tx.membership.findFirst({
        where: {
          customerId,
          status: 'ACTIVE',
        },
        include: {
          plan: { select: { type: true } },
        },
      });

      if (!activeMembership) {
        throw new Error('NO_ACTIVE_MEMBERSHIP');
      }

      const creditCost = classInstance.template?.service?.creditCost || 1;

      // Check and deduct based on membership type
      if (activeMembership.plan.type === 'PUNCH_CARD') {
        if (!activeMembership.sessionsRemaining || activeMembership.sessionsRemaining < 1) {
          throw new Error('NO_SESSIONS_REMAINING');
        }
        await tx.membership.update({
          where: { id: activeMembership.id },
          data: { sessionsRemaining: activeMembership.sessionsRemaining - 1 },
        });
      } else if (activeMembership.plan.type === 'CREDITS') {
        if (!activeMembership.creditsRemaining || activeMembership.creditsRemaining < creditCost) {
          throw new Error('INSUFFICIENT_CREDITS');
        }
        await tx.membership.update({
          where: { id: activeMembership.id },
          data: { creditsRemaining: activeMembership.creditsRemaining - creditCost },
        });
      }
      // SUBSCRIPTION and TRIAL just need active status - already checked

      // Check capacity
      const confirmedCount = classInstance.bookings.filter(b => b.status === 'CONFIRMED').length;
      const isWaitlist = confirmedCount >= classInstance.capacity;

      if (isWaitlist) {
        const waitlistCount = classInstance.bookings.filter(b => b.status === 'WAITLISTED').length;
        if (waitlistCount >= classInstance.waitlistLimit) {
          throw new Error('WAITLIST_FULL');
        }
      }

      // Create or reactivate booking
      let booking;
      if (existingBooking && existingBooking.status === 'CANCELLED') {
        booking = await tx.booking.update({
          where: { id: existingBooking.id },
          data: {
            status: isWaitlist ? 'WAITLISTED' : 'CONFIRMED',
            waitlistPosition: isWaitlist
              ? classInstance.bookings.filter(b => b.status === 'WAITLISTED').length + 1
              : null,
            cancelledAt: null,
            cancelReason: null,
            bookedAt: new Date(),
            source: 'portal',
          },
        });
      } else {
        booking = await tx.booking.create({
          data: {
            customerId,
            classInstanceId,
            status: isWaitlist ? 'WAITLISTED' : 'CONFIRMED',
            waitlistPosition: isWaitlist
              ? classInstance.bookings.filter(b => b.status === 'WAITLISTED').length + 1
              : null,
            source: 'portal',
          },
        });
      }

      return { booking, isWaitlist };
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: result.isWaitlist ? '\u05E0\u05E8\u05E9\u05DE\u05EA \u05DC\u05E8\u05E9\u05D9\u05DE\u05EA \u05D4\u05D4\u05DE\u05EA\u05E0\u05D4' : '\u05D4\u05D4\u05D6\u05DE\u05E0\u05D4 \u05D0\u05D5\u05E9\u05E8\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      const errorMessages: Record<string, { message: string; status: number }> = {
        CLASS_NOT_FOUND: { message: '\u05E9\u05D9\u05E2\u05D5\u05E8 \u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0 \u05D0\u05D5 \u05E9\u05DB\u05D1\u05E8 \u05E2\u05D1\u05E8', status: 404 },
        ALREADY_BOOKED: { message: '\u05DB\u05D1\u05E8 \u05E0\u05E8\u05E9\u05DE\u05EA \u05DC\u05E9\u05D9\u05E2\u05D5\u05E8 \u05D6\u05D4', status: 409 },
        NO_ACTIVE_MEMBERSHIP: { message: '\u05D0\u05D9\u05DF \u05DE\u05E0\u05D5\u05D9 \u05E4\u05E2\u05D9\u05DC. \u05D0\u05E0\u05D0 \u05E4\u05E0\u05D4/\u05D9 \u05DC\u05DE\u05D5\u05E2\u05D3\u05D5\u05DF', status: 403 },
        NO_SESSIONS_REMAINING: { message: '\u05DC\u05D0 \u05E0\u05D5\u05EA\u05E8\u05D5 \u05DB\u05E0\u05D9\u05E1\u05D5\u05EA \u05D1\u05DE\u05E0\u05D5\u05D9', status: 403 },
        INSUFFICIENT_CREDITS: { message: '\u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05D9\u05E7 \u05E7\u05E8\u05D3\u05D9\u05D8\u05D9\u05DD', status: 403 },
        WAITLIST_FULL: { message: '\u05E8\u05E9\u05D9\u05DE\u05EA \u05D4\u05D4\u05DE\u05EA\u05E0\u05D4 \u05DE\u05DC\u05D0\u05D4', status: 409 },
      };

      const errorInfo = errorMessages[error.message];
      if (errorInfo) {
        return NextResponse.json({ error: errorInfo.message }, { status: errorInfo.status });
      }
    }

    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating portal booking:', error);
    return NextResponse.json({ error: '\u05D0\u05D9\u05E8\u05E2\u05D4 \u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D9\u05E6\u05D9\u05E8\u05EA \u05D4\u05D4\u05D6\u05DE\u05E0\u05D4' }, { status: 500 });
  }
}
