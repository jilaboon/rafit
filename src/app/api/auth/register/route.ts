import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth/config';
import { createAuditLog } from '@/lib/security/audit';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit('register');
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, phone } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'כתובת אימייל זו כבר רשומה במערכת' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || null,
        status: 'ACTIVE',
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'user.register',
      entityType: 'user',
      entityId: user.id,
      newValues: { email: user.email, name: user.name },
    });

    // TODO: Send verification email

    return NextResponse.json(
      {
        success: true,
        message: 'המשתמש נוצר בהצלחה',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}
