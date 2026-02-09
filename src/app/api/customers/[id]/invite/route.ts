import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { sendCustomerInvitation } from '@/lib/email';
import { createAuditLog } from '@/lib/security/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('customer:update');
    const { id } = await params;

    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
    }

    // Check if already has a linked user account
    if (customer.userId) {
      return NextResponse.json(
        { error: 'ללקוח כבר יש חשבון בפורטל' },
        { status: 409 }
      );
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.customerInvitation.findFirst({
      where: {
        customerId: customer.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'כבר קיימת הזמנה פעילה ללקוח זה' },
        { status: 409 }
      );
    }

    // Generate invitation
    const token = nanoid(48);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.customerInvitation.create({
      data: {
        tenantId: session.user.tenantId!,
        customerId: customer.id,
        email: customer.email,
        token,
        expiresAt,
        invitedBy: session.user.id,
      },
    });

    // Get tenant name for email
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId! },
      select: { name: true },
    });

    // Send invitation email
    await sendCustomerInvitation({
      email: customer.email,
      token,
      tenantName: tenant?.name || '',
      inviterName: session.user.name || '',
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'customer.invite',
      entityType: 'customer',
      entityId: customer.id,
      newValues: { invitationId: invitation.id },
    });

    return NextResponse.json({
      success: true,
      message: 'ההזמנה נשלחה בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בשליחת ההזמנה' },
      { status: 500 }
    );
  }
}
