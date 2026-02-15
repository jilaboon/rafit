import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';
import { LeadStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['TRIAL', 'LOST'],
  TRIAL: ['CONVERTED', 'LOST'],
  CONVERTED: [],
  LOST: [],
};

const updateStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
});

// PATCH /api/leads/[id]/status - Update lead status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('lead:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status: newStatus } = parsed.data;

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

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[lead.leadStatus];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        { error: `לא ניתן לשנות סטטוס מ-${lead.leadStatus} ל-${newStatus}` },
        { status: 400 }
      );
    }

    // Update status and create activity in a transaction
    const [updatedLead] = await prisma.$transaction([
      prisma.customer.update({
        where: { id },
        data: { leadStatus: newStatus },
      }),
      prisma.leadActivity.create({
        data: {
          customerId: id,
          tenantId: session.user.tenantId!,
          type: 'STATUS_CHANGE',
          description: `סטטוס שונה מ-${lead.leadStatus} ל-${newStatus}`,
          createdBy: session.user.id,
        },
      }),
    ]);

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'lead.status_change',
      entityType: 'customer',
      entityId: id,
      oldValues: { leadStatus: lead.leadStatus },
      newValues: { leadStatus: newStatus },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'סטטוס הליד עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בעדכון סטטוס הליד' },
      { status: 500 }
    );
  }
}
