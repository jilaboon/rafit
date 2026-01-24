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
      let daysInPeriod = 30;

      switch (p) {
        case 'week':
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          previousStart.setDate(previousStart.getDate() - 14);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setDate(previousEnd.getDate() - 7);
          previousEnd.setHours(0, 0, 0, 0);
          daysInPeriod = 7;
          break;
        case 'quarter':
          start.setMonth(start.getMonth() - 3);
          start.setHours(0, 0, 0, 0);
          previousStart.setMonth(previousStart.getMonth() - 6);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setMonth(previousEnd.getMonth() - 3);
          previousEnd.setHours(0, 0, 0, 0);
          daysInPeriod = 90;
          break;
        case 'month':
        default:
          start.setMonth(start.getMonth() - 1);
          start.setHours(0, 0, 0, 0);
          previousStart.setMonth(previousStart.getMonth() - 2);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setMonth(previousEnd.getMonth() - 1);
          previousEnd.setHours(0, 0, 0, 0);
          daysInPeriod = 30;
          break;
      }

      return { start, previousStart, previousEnd, daysInPeriod };
    };

    const { start, previousStart, previousEnd, daysInPeriod } = getDateRange(period);

    // ========== REVENUE DATA ==========
    const currentRevenue = await prisma.payment.aggregate({
      where: {
        customer: { tenantId },
        status: 'COMPLETED',
        createdAt: { gte: start, lte: now },
      },
      _sum: { amount: true },
      _count: true,
    });

    const previousRevenue = await prisma.payment.aggregate({
      where: {
        customer: { tenantId },
        status: 'COMPLETED',
        createdAt: { gte: previousStart, lte: previousEnd },
      },
      _sum: { amount: true },
    });

    const currentAmount = Number(currentRevenue._sum.amount || 0);
    const previousAmount = Number(previousRevenue._sum.amount || 0);
    const revenueChange = previousAmount > 0
      ? Math.round(((currentAmount - previousAmount) / previousAmount) * 100 * 10) / 10
      : currentAmount > 0 ? 100 : 0;

    // ========== MEMBERSHIP DATA ==========
    const activeMemberships = await prisma.membership.count({
      where: {
        customer: { tenantId },
        status: 'ACTIVE',
      },
    });

    const newMemberships = await prisma.membership.count({
      where: {
        customer: { tenantId },
        createdAt: { gte: start, lte: now },
      },
    });

    const cancelledMemberships = await prisma.membership.count({
      where: {
        customer: { tenantId },
        status: 'CANCELLED',
        cancelledAt: { gte: start, lte: now },
      },
    });

    const previousActiveMemberships = await prisma.membership.count({
      where: {
        customer: { tenantId },
        status: 'ACTIVE',
        createdAt: { lte: previousEnd },
      },
    });

    const membershipChange = previousActiveMemberships > 0
      ? Math.round(((activeMemberships - previousActiveMemberships) / previousActiveMemberships) * 100 * 10) / 10
      : activeMemberships > 0 ? 100 : 0;

    // ========== ATTENDANCE DATA ==========
    const classes = await prisma.classInstance.findMany({
      where: {
        branch: { tenantId },
        startTime: { gte: start, lte: now },
        isCancelled: false,
      },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        },
      },
    });

    const totalClasses = classes.length;
    const totalAttendees = classes.reduce((sum, c) => sum + c.bookings.length, 0);
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const avgUtilization = totalCapacity > 0
      ? Math.round((totalAttendees / totalCapacity) * 100)
      : 0;

    // Previous period attendance
    const previousClasses = await prisma.classInstance.findMany({
      where: {
        branch: { tenantId },
        startTime: { gte: previousStart, lte: previousEnd },
        isCancelled: false,
      },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        },
      },
    });

    const previousTotalCapacity = previousClasses.reduce((sum, c) => sum + c.capacity, 0);
    const previousTotalAttendees = previousClasses.reduce((sum, c) => sum + c.bookings.length, 0);
    const previousUtilization = previousTotalCapacity > 0
      ? Math.round((previousTotalAttendees / previousTotalCapacity) * 100)
      : 0;

    const attendanceChange = previousUtilization > 0
      ? Math.round((avgUtilization - previousUtilization) * 10) / 10
      : avgUtilization > 0 ? avgUtilization : 0;

    // ========== TOP CLASSES ==========
    const classStats = await prisma.classInstance.groupBy({
      by: ['name'],
      where: {
        branch: { tenantId },
        startTime: { gte: start, lte: now },
        isCancelled: false,
      },
      _count: { id: true },
    });

    const topClassesData = await Promise.all(
      classStats.map(async (cls) => {
        const instances = await prisma.classInstance.findMany({
          where: {
            branch: { tenantId },
            name: cls.name,
            startTime: { gte: start, lte: now },
            isCancelled: false,
          },
          include: {
            bookings: {
              where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            },
          },
        });

        const attendees = instances.reduce((sum, i) => sum + i.bookings.length, 0);
        const capacity = instances.reduce((sum, i) => sum + i.capacity, 0);
        const utilization = capacity > 0 ? Math.round((attendees / capacity) * 100) : 0;

        return {
          name: cls.name,
          attendees,
          utilization,
          instances: instances.length,
        };
      })
    );

    const topClasses = topClassesData
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 5);

    // ========== RECENT PAYMENTS ==========
    const recentPayments = await prisma.payment.findMany({
      where: {
        customer: { tenantId },
        status: 'COMPLETED',
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formattedPayments = recentPayments.map((p) => ({
      id: p.id,
      customer: `${p.customer.firstName} ${p.customer.lastName}`,
      amount: Number(p.amount),
      type: p.description || 'תשלום',
      date: p.createdAt.toISOString(),
    }));

    // ========== CHART DATA - Revenue by day/week ==========
    const revenueChartData: { date: string; amount: number }[] = [];
    const attendanceChartData: { date: string; attendees: number; capacity: number }[] = [];

    // Group data by day or week depending on period
    const groupByDays = period === 'week' ? 1 : period === 'month' ? 1 : 7;
    const numPoints = period === 'week' ? 7 : period === 'month' ? 30 : 12;

    for (let i = numPoints - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (i * groupByDays));
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + groupByDays);
      dayEnd.setHours(0, 0, 0, 0);

      // Revenue for this period
      const dayRevenue = await prisma.payment.aggregate({
        where: {
          customer: { tenantId },
          status: 'COMPLETED',
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        _sum: { amount: true },
      });

      // Attendance for this period
      const dayClasses = await prisma.classInstance.findMany({
        where: {
          branch: { tenantId },
          startTime: { gte: dayStart, lt: dayEnd },
          isCancelled: false,
        },
        include: {
          bookings: {
            where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
          },
        },
      });

      const dayAttendees = dayClasses.reduce((sum, c) => sum + c.bookings.length, 0);
      const dayCapacity = dayClasses.reduce((sum, c) => sum + c.capacity, 0);

      const dateLabel = dayStart.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
      });

      revenueChartData.push({
        date: dateLabel,
        amount: Number(dayRevenue._sum.amount || 0),
      });

      attendanceChartData.push({
        date: dateLabel,
        attendees: dayAttendees,
        capacity: dayCapacity,
      });
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
