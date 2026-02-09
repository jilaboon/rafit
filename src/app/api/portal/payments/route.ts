import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireCustomerAuth } from '@/lib/auth/customer-auth';
import { handleAuthError } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await requireCustomerAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { customerId: session.user.customerId },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({
        where: { customerId: session.user.customerId },
      }),
    ]);

    return NextResponse.json({
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) return NextResponse.json({ error: message }, { status });
    console.error('Error fetching portal payments:', error);
    return NextResponse.json({ error: 'אירעה שגיאה בטעינת התשלומים' }, { status: 500 });
  }
}
