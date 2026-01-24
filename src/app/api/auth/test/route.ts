import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { compare } from 'bcryptjs';

// Test endpoint to verify auth components work - REMOVE IN PRODUCTION
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('Test auth: checking', email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ step: 'user_lookup', error: 'User not found' });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ step: 'password_check', error: 'No password hash' });
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ step: 'password_compare', error: 'Invalid password' });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ step: 'status_check', error: 'User not active', status: user.status });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
