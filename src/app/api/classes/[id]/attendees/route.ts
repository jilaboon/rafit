import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/classes/:id/attendees - Get attendees for a class
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission('booking:read');
    const { id } = await params;

    // Get class instance with bookings
    const classInstance = await prisma.classInstance.findFirst({
      where: {
        id,
        branch: {
          tenantId: session.user.tenantId,
        },
      },
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
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                dateOfBirth: true,
                medicalNotes: true,
              },
            },
          },
          orderBy: {
            bookedAt: 'asc',
          },
        },
      },
    });

    if (!classInstance) {
      return NextResponse.json({ error: 'שיעור לא נמצא' }, { status: 404 });
    }

    // Get membership info for each attendee
    const customerIds = classInstance.bookings.map((b) => b.customer.id);
    const memberships = await prisma.membership.findMany({
      where: {
        customerId: { in: customerIds },
        status: 'ACTIVE',
      },
      include: {
        plan: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    const membershipMap = new Map(
      memberships.map((m) => [m.customerId, m])
    );

    // Format attendees
    // Use Israel timezone for "today" to handle UTC offset correctly
    const nowInIsrael = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    const todayMonth = nowInIsrael.getMonth();
    const todayDay = nowInIsrael.getDate();

    const attendees = classInstance.bookings.map((booking) => {
      const membership = membershipMap.get(booking.customerId);
      let membershipType = 'ללא מנוי';

      if (membership) {
        if (membership.plan.type === 'PUNCH_CARD' && membership.sessionsRemaining !== null) {
          membershipType = `${membership.plan.name} (${membership.sessionsRemaining} נותרו)`;
        } else if (membership.plan.type === 'CREDITS' && membership.creditsRemaining !== null) {
          membershipType = `${membership.plan.name} (${membership.creditsRemaining} קרדיטים)`;
        } else {
          membershipType = membership.plan.name;
        }
      }

      // Check if today is the customer's birthday (compare using UTC for stored dates)
      let isBirthday = false;
      if (booking.customer.dateOfBirth) {
        const dob = new Date(booking.customer.dateOfBirth);
        isBirthday = dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDay;
      }

      return {
        id: booking.customer.id,
        bookingId: booking.id,
        name: `${booking.customer.firstName} ${booking.customer.lastName}`,
        email: booking.customer.email,
        phone: booking.customer.phone,
        membershipType,
        checkedIn: !!booking.checkedInAt,
        checkedInAt: booking.checkedInAt,
        status: booking.status,
        isBirthday,
        medicalNotes: booking.customer.medicalNotes,
      };
    });

    return NextResponse.json({
      class: {
        id: classInstance.id,
        name: classInstance.name,
        description: classInstance.description,
        startTime: classInstance.startTime,
        endTime: classInstance.endTime,
        capacity: classInstance.capacity,
        isCancelled: classInstance.isCancelled,
        branch: classInstance.branch,
        room: classInstance.room?.name,
        coach: classInstance.coach?.tenantUser?.user?.name || classInstance.coach?.title,
      },
      attendees,
      stats: {
        total: attendees.length,
        checkedIn: attendees.filter((a) => a.checkedIn).length,
        pending: attendees.filter((a) => !a.checkedIn).length,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching attendees:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת המשתתפים' },
      { status: 500 }
    );
  }
}
