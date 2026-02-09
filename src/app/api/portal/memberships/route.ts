import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireCustomerAuth } from '@/lib/auth/customer-auth';
import { handleAuthError } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await requireCustomerAuth();

    const memberships = await prisma.membership.findMany({
      where: { customerId: session.user.customerId },
      include: {
        plan: {
          select: {
            name: true,
            description: true,
            type: true,
            price: true,
            billingCycle: true,
            sessions: true,
            credits: true,
            validDays: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first
        { startDate: 'desc' },
      ],
    });

    const formattedMemberships = memberships.map((m) => ({
      id: m.id,
      status: m.status,
      startDate: m.startDate,
      endDate: m.endDate,
      sessionsRemaining: m.sessionsRemaining,
      creditsRemaining: m.creditsRemaining,
      autoRenew: m.autoRenew,
      plan: {
        name: m.plan.name,
        description: m.plan.description,
        type: m.plan.type,
        price: Number(m.plan.price),
        billingCycle: m.plan.billingCycle,
        totalSessions: m.plan.sessions,
        totalCredits: m.plan.credits,
        validDays: m.plan.validDays,
      },
    }));

    return NextResponse.json({ memberships: formattedMemberships });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) return NextResponse.json({ error: message }, { status });
    console.error('Error fetching portal memberships:', error);
    return NextResponse.json({ error: 'אירעה שגיאה בטעינת המנויים' }, { status: 500 });
  }
}
