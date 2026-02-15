import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';
import { LeadActivityType } from '@prisma/client';

const createActivitySchema = z.object({
  type: z.nativeEnum(LeadActivityType),
  description: z.string().min(1).max(1000),
});

// GET /api/leads/[id]/activities - List activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('lead:read');
    const { id } = await params;

    // Validate tenant ownership
    const lead = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'ליד לא נמצא' },
        { status: 404 }
      );
    }

    const activities = await prisma.leadActivity.findMany({
      where: {
        customerId: id,
        tenantId: session.user.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching lead activities:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הפעילויות' },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/activities - Create activity for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('lead:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Validate tenant ownership
    const lead = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'ליד לא נמצא' },
        { status: 404 }
      );
    }

    const activity = await prisma.leadActivity.create({
      data: {
        customerId: id,
        tenantId: session.user.tenantId!,
        type: parsed.data.type,
        description: parsed.data.description,
        createdBy: session.user.id,
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'lead.activity_create',
      entityType: 'lead_activity',
      entityId: activity.id,
      newValues: {
        customerId: id,
        type: parsed.data.type,
        description: parsed.data.description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        activity,
        message: 'הפעילות נוצרה בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating lead activity:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת הפעילות' },
      { status: 500 }
    );
  }
}
