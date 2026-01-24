import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { nanoid } from 'nanoid';

const magicLinkSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit('magicLink');
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const parsed = magicLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'כתובת אימייל לא תקינה' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'אם הכתובת קיימת במערכת, נשלח אליך קישור התחברות',
      });
    }

    // Generate verification token
    const token = nanoid(32);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // TODO: Send email with magic link
    // For now, log the token in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Magic link for ${user.email}: ${process.env.AUTH_URL}/api/auth/callback/email?token=${token}&email=${encodeURIComponent(user.email)}`);
    }

    return NextResponse.json({
      success: true,
      message: 'קישור התחברות נשלח לאימייל שלך',
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בשליחת הקישור' },
      { status: 500 }
    );
  }
}
