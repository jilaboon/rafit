import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireCustomerAuth } from '@/lib/auth/customer-auth';
import { handleAuthError } from '@/lib/auth/permissions';

// DELETE /api/portal/bookings/[id] - Cancel own booking
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCustomerAuth();
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        customerId: session.user.customerId,
        status: { in: ['CONFIRMED', 'WAITLISTED'] },
      },
      include: {
        classInstance: {
          select: {
            startTime: true,
            branch: { select: { tenantId: true } },
            template: {
              select: { service: { select: { creditCost: true } } },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: '\u05D4\u05D6\u05DE\u05E0\u05D4 \u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0\u05D4' }, { status: 404 });
    }

    // Check cancellation window
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.customerTenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const bookingSettings = (settings.booking as Record<string, unknown>) || {};
    const cancellationHours = (bookingSettings.cancellationHours as number) || 2;

    const classStartTime = new Date(booking.classInstance.startTime);
    const cancellationDeadline = new Date(classStartTime.getTime() - cancellationHours * 60 * 60 * 1000);

    if (new Date() > cancellationDeadline) {
      return NextResponse.json(
        { error: `\u05DC\u05D0 \u05E0\u05D9\u05EA\u05DF \u05DC\u05D1\u05D8\u05DC \u05E4\u05D7\u05D5\u05EA \u05DE-${cancellationHours} \u05E9\u05E2\u05D5\u05EA \u05DC\u05E4\u05E0\u05D9 \u05D4\u05E9\u05D9\u05E2\u05D5\u05E8` },
        { status: 400 }
      );
    }

    // Cancel and restore credits/sessions if applicable
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: '\u05D1\u05D9\u05D8\u05D5\u05DC \u05E2\u05E6\u05DE\u05D9 \u05DE\u05D4\u05E4\u05D5\u05E8\u05D8\u05DC',
        },
      });

      // Restore membership credits/sessions
      const activeMembership = await tx.membership.findFirst({
        where: {
          customerId: session.user.customerId,
          status: 'ACTIVE',
        },
        include: { plan: { select: { type: true } } },
      });

      if (activeMembership) {
        const creditCost = booking.classInstance.template?.service?.creditCost || 1;

        if (activeMembership.plan.type === 'PUNCH_CARD' && activeMembership.sessionsRemaining !== null) {
          await tx.membership.update({
            where: { id: activeMembership.id },
            data: { sessionsRemaining: activeMembership.sessionsRemaining + 1 },
          });
        } else if (activeMembership.plan.type === 'CREDITS' && activeMembership.creditsRemaining !== null) {
          await tx.membership.update({
            where: { id: activeMembership.id },
            data: { creditsRemaining: activeMembership.creditsRemaining + creditCost },
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: '\u05D4\u05D4\u05D6\u05DE\u05E0\u05D4 \u05D1\u05D5\u05D8\u05DC\u05D4 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4' });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error cancelling portal booking:', error);
    return NextResponse.json({ error: '\u05D0\u05D9\u05E8\u05E2\u05D4 \u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D1\u05D9\u05D8\u05D5\u05DC \u05D4\u05D4\u05D6\u05DE\u05E0\u05D4' }, { status: 500 });
  }
}
