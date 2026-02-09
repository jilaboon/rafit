import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireCustomerAuth } from '@/lib/auth/customer-auth';
import { handleAuthError } from '@/lib/auth/permissions';

const updateProfileSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergencyContact: z.string().max(100).optional().nullable(),
  emergencyPhone: z.string().max(20).optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireCustomerAuth();

    const customer = await prisma.customer.findUnique({
      where: { id: session.user.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
    }

    return NextResponse.json({ profile: customer });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) return NextResponse.json({ error: message }, { status });
    console.error('Error fetching portal profile:', error);
    return NextResponse.json({ error: 'אירעה שגיאה בטעינת הפרופיל' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireCustomerAuth();
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.customer.update({
      where: { id: session.user.customerId },
      data: parsed.data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
      },
    });

    return NextResponse.json({ success: true, profile: updated, message: 'הפרופיל עודכן בהצלחה' });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) return NextResponse.json({ error: message }, { status });
    console.error('Error updating portal profile:', error);
    return NextResponse.json({ error: 'אירעה שגיאה בעדכון הפרופיל' }, { status: 500 });
  }
}
