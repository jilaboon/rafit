import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const convertSchema = z.object({
  membershipPlanId: z.string().uuid().optional(),
});

// POST /api/leads/[id]/convert - Convert lead to customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('lead:convert');
    const { id } = await params;

    const body = await request.json();
    const parsed = convertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Fetch the lead and validate tenant ownership
    const lead = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'ליד לא נמצא' },
        { status: 404 }
      );
    }

    // Cannot convert already converted or lost leads
    if (lead.leadStatus === 'CONVERTED') {
      return NextResponse.json(
        { error: 'ליד זה כבר הומר ללקוח' },
        { status: 400 }
      );
    }
    if (lead.leadStatus === 'LOST') {
      return NextResponse.json(
        { error: 'לא ניתן להמיר ליד אבוד. שנה את הסטטוס לפני ההמרה' },
        { status: 400 }
      );
    }

    // Validate membership plan belongs to same tenant if provided
    if (parsed.data.membershipPlanId) {
      const plan = await prisma.membershipPlan.findFirst({
        where: {
          id: parsed.data.membershipPlanId,
          tenantId: session.user.tenantId,
          isActive: true,
          deletedAt: null,
        },
      });
      if (!plan) {
        return NextResponse.json(
          { error: 'תוכנית מנוי לא נמצאה' },
          { status: 404 }
        );
      }
    }

    const transactionOps = [
      prisma.customer.update({
        where: { id },
        data: { leadStatus: 'CONVERTED' },
      }),
      prisma.leadActivity.create({
        data: {
          customerId: id,
          tenantId: session.user.tenantId!,
          type: 'CONVERSION',
          description: parsed.data.membershipPlanId
            ? 'ליד הומר ללקוח עם הקצאת מנוי'
            : 'ליד הומר ללקוח',
          createdBy: session.user.id,
        },
      }),
    ];

    // Optionally assign a membership plan
    if (parsed.data.membershipPlanId) {
      transactionOps.push(
        prisma.membership.create({
          data: {
            customerId: id,
            planId: parsed.data.membershipPlanId,
            status: 'ACTIVE',
            startDate: new Date(),
          },
        }) as never
      );
    }

    const [updatedLead] = await prisma.$transaction(transactionOps);

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'lead.convert',
      entityType: 'customer',
      entityId: id,
      oldValues: { leadStatus: lead.leadStatus },
      newValues: { leadStatus: 'CONVERTED' },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'הליד הומר ללקוח בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error converting lead:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בהמרת הליד' },
      { status: 500 }
    );
  }
}
