import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const validateSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ valid: false, error: 'טוקן חסר' }, { status: 400 });
    }

    const invitation = await prisma.customerInvitation.findUnique({
      where: { token: parsed.data.token },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            tenantId: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ valid: false, error: 'הזמנה לא נמצאה' });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ valid: false, error: 'הזמנה זו כבר מומשה' });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: 'ההזמנה פגה תוקף' });
    }

    // Get tenant name
    const tenant = await prisma.tenant.findUnique({
      where: { id: invitation.customer.tenantId },
      select: { name: true },
    });

    return NextResponse.json({
      valid: true,
      email: invitation.customer.email,
      firstName: invitation.customer.firstName,
      lastName: invitation.customer.lastName,
      tenantName: tenant?.name || '',
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { valid: false, error: 'אירעה שגיאה' },
      { status: 500 }
    );
  }
}
