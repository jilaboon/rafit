import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';

const registerSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  password: z.string().min(8, 'סיסמה חייבת להכיל לפחות 8 תווים'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, name, password } = parsed.data;

    // Validate invitation
    const invitation = await prisma.customerInvitation.findUnique({
      where: { token },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            userId: true,
            tenantId: true,
          },
        },
      },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'הזמנה לא תקינה או שפגה תוקפה' },
        { status: 400 }
      );
    }

    if (invitation.customer.userId) {
      return NextResponse.json(
        { error: 'ללקוח כבר יש חשבון. אנא התחבר/י' },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Transaction: create user (or link existing), update customer, accept invitation
    const result = await prisma.$transaction(async (tx) => {
      // Check if a User with this email already exists
      let user = await tx.user.findUnique({
        where: { email: invitation.customer.email },
      });

      if (user) {
        // Link existing user - just update password if they don't have one
        if (!user.passwordHash) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { passwordHash, name },
          });
        }
      } else {
        // Create new user
        user = await tx.user.create({
          data: {
            email: invitation.customer.email,
            name,
            passwordHash,
            status: 'ACTIVE',
            emailVerifiedAt: new Date(), // Verified via invitation
          },
        });
      }

      // Link customer to user
      await tx.customer.update({
        where: { id: invitation.customer.id },
        data: { userId: user.id },
      });

      // Mark invitation as accepted
      await tx.customerInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'ההרשמה הושלמה בהצלחה',
      email: result.email,
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}
