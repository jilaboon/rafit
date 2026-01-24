import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const createMembershipSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string().optional(),
  autoRenew: z.boolean().default(true),
});

// GET /api/memberships - List memberships
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('membership:read');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const planId = searchParams.get('planId');
    const customerId = searchParams.get('customerId');

    const where: Record<string, unknown> = {
      customer: {
        tenantId: session.user.tenantId,
      },
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (planId) {
      where.planId = planId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.customer = {
        ...where.customer as object,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            billingCycle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedMemberships = memberships.map((m) => ({
      id: m.id,
      customerId: m.customerId,
      customerName: `${m.customer.firstName} ${m.customer.lastName}`,
      customerEmail: m.customer.email,
      planId: m.planId,
      planName: m.plan.name,
      planType: m.plan.type,
      status: m.status,
      startDate: m.startDate,
      endDate: m.endDate,
      sessionsRemaining: m.sessionsRemaining,
      creditsRemaining: m.creditsRemaining,
      autoRenew: m.autoRenew,
      price: Number(m.plan.price),
      createdAt: m.createdAt,
    }));

    // Stats
    const stats = {
      active: memberships.filter((m) => m.status === 'ACTIVE').length,
      paused: memberships.filter((m) => m.status === 'PAUSED').length,
      expired: memberships.filter((m) => m.status === 'EXPIRED').length,
      totalRevenue: memberships
        .filter((m) => m.status === 'ACTIVE')
        .reduce((sum, m) => sum + Number(m.plan.price), 0),
    };

    return NextResponse.json({
      memberships: formattedMemberships,
      stats,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching memberships:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת המנויים' },
      { status: 500 }
    );
  }
}

// POST /api/memberships - Create membership
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('membership:create');

    const body = await request.json();
    const parsed = createMembershipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
    }

    // Verify plan belongs to tenant
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: data.planId,
        tenantId: session.user.tenantId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'תוכנית לא נמצאה' }, { status: 404 });
    }

    // Calculate end date based on plan
    const startDate = new Date(data.startDate);
    let endDate: Date | null = null;

    if (data.endDate) {
      endDate = new Date(data.endDate);
    } else if (plan.validDays) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.validDays);
    } else if (plan.billingCycle === 'monthly') {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.billingCycle === 'yearly') {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const membership = await prisma.membership.create({
      data: {
        customerId: data.customerId,
        planId: data.planId,
        startDate,
        endDate,
        sessionsRemaining: plan.sessions,
        creditsRemaining: plan.credits,
        autoRenew: data.autoRenew,
        status: 'ACTIVE',
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'membership.create',
      entityType: 'membership',
      entityId: membership.id,
      newValues: {
        customerId: data.customerId,
        customerName: `${membership.customer.firstName} ${membership.customer.lastName}`,
        planId: data.planId,
        planName: membership.plan.name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        membership,
        message: 'המנוי נוצר בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating membership:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת המנוי' },
      { status: 500 }
    );
  }
}
