import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';

// GET /api/dashboard/payments - Get payments summary and recent payments
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('report:revenue');
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Get recent payments
    const payments = await prisma.payment.findMany({
      where: {
        customer: {
          tenantId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Get pending payments summary
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

    // Get completed payments today
    const completedToday = await prisma.payment.aggregate({
      where: {
        customer: {
          tenantId,
        },
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Format payments
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      description: payment.description,
      customerName: `${payment.customer.firstName} ${payment.customer.lastName}`,
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      payments: formattedPayments,
      summary: {
        pendingCount: pendingPayments._count,
        pendingAmount: Number(pendingPayments._sum.amount || 0),
        completedToday: completedToday._count,
        completedTodayAmount: Number(completedToday._sum.amount || 0),
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת התשלומים' },
      { status: 500 }
    );
  }
}
