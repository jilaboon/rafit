import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { createAuditLog } from '@/lib/security/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bookings/:id/checkin - Check in a customer
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get booking with tenant verification
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        customer: {
          tenantId: session.user.tenantId,
        },
        status: 'CONFIRMED',
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        classInstance: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'הזמנה לא נמצאה או שהסטטוס אינו מאושר' },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (booking.checkedInAt) {
      return NextResponse.json(
        { error: 'הלקוח כבר עשה צ\'ק-אין' },
        { status: 400 }
      );
    }

    // Verify class is today and within reasonable check-in window (2 hours before to 30 min after)
    const now = new Date();
    const classStart = new Date(booking.classInstance.startTime);
    const classEnd = new Date(booking.classInstance.endTime);

    const twoHoursBefore = new Date(classStart.getTime() - 2 * 60 * 60 * 1000);
    const thirtyMinAfter = new Date(classEnd.getTime() + 30 * 60 * 1000);

    if (now < twoHoursBefore || now > thirtyMinAfter) {
      return NextResponse.json(
        { error: 'צ\'ק-אין אפשרי רק בטווח של שעתיים לפני ועד חצי שעה אחרי השיעור' },
        { status: 400 }
      );
    }

    // Update booking with check-in time
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        checkedInAt: now,
        status: 'COMPLETED',
      },
    });

    // Deduct from membership if applicable (punch card / credits)
    const membership = await prisma.membership.findFirst({
      where: {
        customerId: booking.customerId,
        status: 'ACTIVE',
        OR: [
          { sessionsRemaining: { gt: 0 } },
          { creditsRemaining: { gt: 0 } },
          { plan: { type: 'SUBSCRIPTION' } },
        ],
      },
      include: {
        plan: true,
      },
    });

    if (membership) {
      if (membership.sessionsRemaining !== null && membership.sessionsRemaining > 0) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: {
            sessionsRemaining: membership.sessionsRemaining - 1,
          },
        });
      } else if (membership.creditsRemaining !== null && membership.creditsRemaining > 0) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: {
            creditsRemaining: membership.creditsRemaining - 1,
          },
        });
      }
    }

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'booking.checkin',
      entityType: 'booking',
      entityId: id,
      newValues: {
        checkedInAt: now.toISOString(),
        customerId: booking.customerId,
        classInstanceId: booking.classInstanceId,
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: `${booking.customer.firstName} ${booking.customer.lastName} עשה צ'ק-אין בהצלחה`,
    });
  } catch (error) {
    console.error('Error checking in:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בצ\'ק-אין' },
      { status: 500 }
    );
  }
}
