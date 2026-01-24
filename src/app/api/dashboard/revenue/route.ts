import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

// GET /api/dashboard/revenue - Get revenue summary
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('report:revenue');
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year

    const now = new Date();

    // Calculate date ranges based on period
    const getDateRange = (p: string) => {
      const start = new Date(now);
      const previousStart = new Date(now);
      const previousEnd = new Date(now);

      switch (p) {
        case 'day':
          start.setHours(0, 0, 0, 0);
          previousStart.setDate(previousStart.getDate() - 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setDate(previousEnd.getDate() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start.setDate(start.getDate() - start.getDay());
          start.setHours(0, 0, 0, 0);
          previousStart.setDate(previousStart.getDate() - previousStart.getDay() - 7);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setDate(previousEnd.getDate() - previousEnd.getDay() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'year':
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
          previousStart.setFullYear(previousStart.getFullYear() - 1, 0, 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setFullYear(previousEnd.getFullYear() - 1, 11, 31);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'month':
        default:
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          previousStart.setMonth(previousStart.getMonth() - 1, 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setDate(0); // Last day of previous month
          previousEnd.setHours(23, 59, 59, 999);
          break;
      }

      return { start, previousStart, previousEnd };
    };

    const { start, previousStart, previousEnd } = getDateRange(period);

    // Get current period revenue
    const currentRevenue = await prisma.payment.aggregate({
      where: {
        customer: {
          tenantId,
        },
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: now,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get previous period revenue
    const previousRevenue = await prisma.payment.aggregate({
      where: {
        customer: {
          tenantId,
        },
        status: 'COMPLETED',
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get pending payments
    const pendingPayments = await prisma.payment.aggregate({
      where: {
        customer: {
          tenantId,
        },
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get new memberships this period
    const newMemberships = await prisma.membership.count({
      where: {
        customer: {
          tenantId,
        },
        createdAt: {
          gte: start,
          lte: now,
        },
      },
    });

    // Get expiring memberships (next 30 days)
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMemberships = await prisma.membership.count({
      where: {
        customer: {
          tenantId,
        },
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    });

    const currentAmount = Number(currentRevenue._sum.amount || 0);
    const previousAmount = Number(previousRevenue._sum.amount || 0);
    const pendingAmount = Number(pendingPayments._sum.amount || 0);

    // Calculate percentage change
    const percentageChange = previousAmount > 0
      ? Math.round(((currentAmount - previousAmount) / previousAmount) * 100)
      : currentAmount > 0
        ? 100
        : 0;

    return NextResponse.json({
      current: {
        amount: currentAmount,
        count: currentRevenue._count,
        period,
      },
      previous: {
        amount: previousAmount,
        count: previousRevenue._count,
      },
      pending: {
        amount: pendingAmount,
        count: pendingPayments._count,
      },
      memberships: {
        new: newMemberships,
        expiring: expiringMemberships,
      },
      percentageChange,
      currency: 'ILS',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching revenue:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת נתוני ההכנסות' },
      { status: 500 }
    );
  }
}
