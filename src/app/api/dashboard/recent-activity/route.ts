import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireTenant, handleAuthError } from '@/lib/auth/permissions';

// GET /api/dashboard/recent-activity - Get recent activity feed
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant();
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get recent audit logs for this tenant
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        // Filter to relevant actions
        action: {
          in: [
            'booking.create',
            'booking.cancel',
            'booking.checkin',
            'customer.create',
            'membership.create',
            'payment.create',
            'user.login',
          ],
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Batch-fetch all referenced bookings in a single query (was N+1: 1 query per log)
    const bookingActions = ['booking.create', 'booking.checkin'];
    const bookingIds = logs
      .filter((log) => bookingActions.includes(log.action) && log.entityId)
      .map((log) => log.entityId!);

    const bookingsMap = new Map<string, { customer: { firstName: string; lastName: string }; classInstance: { name: string } }>();
    if (bookingIds.length > 0) {
      const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          classInstance: { select: { name: true } },
        },
      });
      for (const b of bookings) {
        bookingsMap.set(b.id, b);
      }
    }

    // Format the activity items (no more DB calls in the loop)
    const activities = logs.map((log) => {
      let description = '';
      const newValues = log.newValues as Record<string, unknown> | null;

      switch (log.action) {
        case 'booking.create': {
          const booking = log.entityId ? bookingsMap.get(log.entityId) : null;
          if (booking) {
            description = `${booking.customer.firstName} ${booking.customer.lastName} הזמין/ה ${booking.classInstance.name}`;
          }
          break;
        }
        case 'booking.cancel':
          description = 'הזמנה בוטלה';
          break;
        case 'booking.checkin': {
          const checkinBooking = log.entityId ? bookingsMap.get(log.entityId) : null;
          if (checkinBooking) {
            description = `${checkinBooking.customer.firstName} ${checkinBooking.customer.lastName} עשה/תה צ'ק-אין`;
          }
          break;
        }
        case 'customer.create':
          if (newValues && typeof newValues === 'object') {
            const firstName = newValues.firstName || '';
            const lastName = newValues.lastName || '';
            description = `לקוח חדש: ${firstName} ${lastName}`;
          }
          break;
        case 'membership.create':
          description = 'מנוי חדש נוצר';
          break;
        case 'payment.create':
          if (newValues && typeof newValues === 'object') {
            const amount = newValues.amount || 0;
            description = `תשלום התקבל: ₪${amount}`;
          }
          break;
        case 'user.login':
          description = 'משתמש התחבר';
          break;
        default:
          description = log.action;
      }

      return {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        description: description || log.action,
        userName: log.user?.name,
        createdAt: log.createdAt.toISOString(),
      };
    });

    // Filter out activities with no description
    const filteredActivities = activities.filter((a) => a.description);

    return NextResponse.json({
      activities: filteredActivities,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הפעילות האחרונה' },
      { status: 500 }
    );
  }
}
