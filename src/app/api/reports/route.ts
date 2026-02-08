import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

// GET /api/reports - Get comprehensive reports data
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('report:revenue');
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, quarter

    const now = new Date();

    // Calculate date ranges based on period
    const getDateRange = (p: string) => {
      const start = new Date(now);
      const previousStart = new Date(now);
      const previousEnd = new Date(now);

      switch (p) {
        case 'week':
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          previousStart.setDate(previousStart.getDate() - 14);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setDate(previousEnd.getDate() - 7);
          previousEnd.setHours(0, 0, 0, 0);
          break;
        case 'quarter':
          start.setMonth(start.getMonth() - 3);
          start.setHours(0, 0, 0, 0);
          previousStart.setMonth(previousStart.getMonth() - 6);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setMonth(previousEnd.getMonth() - 3);
          previousEnd.setHours(0, 0, 0, 0);
          break;
        case 'month':
        default:
          start.setMonth(start.getMonth() - 1);
          start.setHours(0, 0, 0, 0);
          previousStart.setMonth(previousStart.getMonth() - 2);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setMonth(previousEnd.getMonth() - 1);
          previousEnd.setHours(0, 0, 0, 0);
          break;
      }

      return { start, previousStart, previousEnd };
    };

    const { start, previousStart, previousEnd } = getDateRange(period);

    // ========== FETCH ALL DATA IN PARALLEL (was 70+ sequential queries) ==========
    const [
      currentRevenue,
      previousRevenue,
      activeMemberships,
      newMemberships,
      cancelledMemberships,
      previousActiveMemberships,
      classes,
      previousClasses,
      recentPayments,
      allPaymentsForChart,
    ] = await Promise.all([
      // Revenue - current period
      prisma.payment.aggregate({
        where: {
          customer: { tenantId },
          status: 'COMPLETED',
          createdAt: { gte: start, lte: now },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Revenue - previous period
      prisma.payment.aggregate({
        where: {
          customer: { tenantId },
          status: 'COMPLETED',
          createdAt: { gte: previousStart, lte: previousEnd },
        },
        _sum: { amount: true },
      }),
      // Memberships - active
      prisma.membership.count({
        where: { customer: { tenantId }, status: 'ACTIVE' },
      }),
      // Memberships - new
      prisma.membership.count({
        where: { customer: { tenantId }, createdAt: { gte: start, lte: now } },
      }),
      // Memberships - cancelled
      prisma.membership.count({
        where: {
          customer: { tenantId },
          status: 'CANCELLED',
          cancelledAt: { gte: start, lte: now },
        },
      }),
      // Memberships - previous active
      prisma.membership.count({
        where: {
          customer: { tenantId },
          status: 'ACTIVE',
          createdAt: { lte: previousEnd },
        },
      }),
      // Attendance - current period (includes bookings)
      prisma.classInstance.findMany({
        where: {
          branch: { tenantId },
          startTime: { gte: start, lte: now },
          isCancelled: false,
        },
        include: {
          bookings: {
            where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            select: { id: true },
          },
        },
      }),
      // Attendance - previous period
      prisma.classInstance.findMany({
        where: {
          branch: { tenantId },
          startTime: { gte: previousStart, lte: previousEnd },
          isCancelled: false,
        },
        include: {
          bookings: {
            where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            select: { id: true },
          },
        },
      }),
      // Recent payments
      prisma.payment.findMany({
        where: { customer: { tenantId }, status: 'COMPLETED' },
        include: {
          customer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // All payments in period for chart (single bulk query instead of 30 individual ones)
      prisma.payment.findMany({
        where: {
          customer: { tenantId },
          status: 'COMPLETED',
          createdAt: { gte: start, lte: now },
        },
        select: { amount: true, createdAt: true },
      }),
    ]);

    // ========== COMPUTE REVENUE METRICS ==========
    const currentAmount = Number(currentRevenue._sum.amount || 0);
    const previousAmount = Number(previousRevenue._sum.amount || 0);
    const revenueChange = previousAmount > 0
      ? Math.round(((currentAmount - previousAmount) / previousAmount) * 100 * 10) / 10
      : currentAmount > 0 ? 100 : 0;

    // ========== COMPUTE MEMBERSHIP METRICS ==========
    const membershipChange = previousActiveMemberships > 0
      ? Math.round(((activeMemberships - previousActiveMemberships) / previousActiveMemberships) * 100 * 10) / 10
      : activeMemberships > 0 ? 100 : 0;

    // ========== COMPUTE ATTENDANCE METRICS ==========
    const totalClasses = classes.length;
    const totalAttendees = classes.reduce((sum, c) => sum + c.bookings.length, 0);
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const avgUtilization = totalCapacity > 0
      ? Math.round((totalAttendees / totalCapacity) * 100)
      : 0;

    const previousTotalCapacity = previousClasses.reduce((sum, c) => sum + c.capacity, 0);
    const previousTotalAttendees = previousClasses.reduce((sum, c) => sum + c.bookings.length, 0);
    const previousUtilization = previousTotalCapacity > 0
      ? Math.round((previousTotalAttendees / previousTotalCapacity) * 100)
      : 0;

    const attendanceChange = previousUtilization > 0
      ? Math.round((avgUtilization - previousUtilization) * 10) / 10
      : avgUtilization > 0 ? avgUtilization : 0;

    // ========== TOP CLASSES (computed from already-fetched data, no extra queries) ==========
    const classMap = new Map<string, { attendees: number; capacity: number; instances: number }>();
    for (const cls of classes) {
      const existing = classMap.get(cls.name) || { attendees: 0, capacity: 0, instances: 0 };
      existing.attendees += cls.bookings.length;
      existing.capacity += cls.capacity;
      existing.instances += 1;
      classMap.set(cls.name, existing);
    }

    const topClasses = Array.from(classMap.entries())
      .map(([name, data]) => ({
        name,
        attendees: data.attendees,
        utilization: data.capacity > 0 ? Math.round((data.attendees / data.capacity) * 100) : 0,
        instances: data.instances,
      }))
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 5);

    // ========== RECENT PAYMENTS ==========
    const formattedPayments = recentPayments.map((p) => ({
      id: p.id,
      customer: `${p.customer.firstName} ${p.customer.lastName}`,
      amount: Number(p.amount),
      type: p.description || 'תשלום',
      date: p.createdAt.toISOString(),
    }));

    // ========== CHART DATA (computed from already-fetched data, no extra queries) ==========
    const groupByDays = period === 'week' ? 1 : period === 'month' ? 1 : 7;
    const numPoints = period === 'week' ? 7 : period === 'month' ? 30 : 12;

    // Build chart buckets
    const revenueChartData: { date: string; amount: number }[] = [];
    const attendanceChartData: { date: string; attendees: number; capacity: number }[] = [];

    for (let i = numPoints - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (i * groupByDays));
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + groupByDays);
      dayEnd.setHours(0, 0, 0, 0);

      // Revenue: filter from bulk-fetched payments
      const dayAmount = allPaymentsForChart
        .filter((p) => p.createdAt >= dayStart && p.createdAt < dayEnd)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Attendance: filter from already-fetched classes
      const dayClasses = classes.filter(
        (c) => c.startTime >= dayStart && c.startTime < dayEnd
      );
      const dayAttendees = dayClasses.reduce((sum, c) => sum + c.bookings.length, 0);
      const dayCapacity = dayClasses.reduce((sum, c) => sum + c.capacity, 0);

      const dateLabel = dayStart.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
      });

      revenueChartData.push({ date: dateLabel, amount: dayAmount });
      attendanceChartData.push({ date: dateLabel, attendees: dayAttendees, capacity: dayCapacity });
    }

    return NextResponse.json({
      revenue: {
        total: currentAmount,
        change: revenueChange,
        isPositive: revenueChange >= 0,
        transactionCount: currentRevenue._count,
      },
      memberships: {
        total: activeMemberships,
        newThisMonth: newMemberships,
        churned: cancelledMemberships,
        change: membershipChange,
        isPositive: membershipChange >= 0,
      },
      attendance: {
        totalClasses,
        totalAttendees,
        avgUtilization,
        change: attendanceChange,
        isPositive: attendanceChange >= 0,
      },
      topClasses,
      recentPayments: formattedPayments,
      charts: {
        revenue: revenueChartData,
        attendance: attendanceChartData,
      },
      period,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הדוחות' },
      { status: 500 }
    );
  }
}
