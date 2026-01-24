import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['SUBSCRIPTION', 'PUNCH_CARD', 'CREDITS', 'TRIAL', 'DROP_IN']),
  price: z.number().min(0),
  billingCycle: z.string().optional(),
  sessions: z.number().int().min(1).optional(),
  credits: z.number().int().min(1).optional(),
  validDays: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
});

// GET /api/membership-plans - List plans
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('membership:read');

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      deletedAt: null,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const plans = await prisma.membershipPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            memberships: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      price: Number(plan.price),
      billingCycle: plan.billingCycle,
      sessions: plan.sessions,
      credits: plan.credits,
      validDays: plan.validDays,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      activeCount: plan._count.memberships,
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת התוכניות' },
      { status: 500 }
    );
  }
}

// POST /api/membership-plans - Create plan
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('membership:create');

    const body = await request.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const plan = await prisma.membershipPlan.create({
      data: {
        tenantId: session.user.tenantId!,
        name: data.name,
        description: data.description,
        type: data.type,
        price: data.price,
        billingCycle: data.billingCycle,
        sessions: data.sessions,
        credits: data.credits,
        validDays: data.validDays,
        isActive: data.isActive,
        isPublic: data.isPublic,
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'membership.create',
      entityType: 'membershipPlan',
      entityId: plan.id,
      newValues: {
        name: data.name,
        type: data.type,
        price: data.price,
      },
    });

    return NextResponse.json(
      {
        success: true,
        plan: {
          ...plan,
          price: Number(plan.price),
        },
        message: 'התוכנית נוצרה בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת התוכנית' },
      { status: 500 }
    );
  }
}
