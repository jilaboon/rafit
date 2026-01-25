import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// DEBUG ONLY - Remove after debugging
// GET /api/debug/users - Check which users exist
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        passwordHash: true,
      },
      orderBy: { email: 'asc' },
    });

    // Return users with password hash truncated (just to verify it exists)
    const safeUsers = users.map(u => ({
      email: u.email,
      name: u.name,
      status: u.status,
      hasPassword: !!u.passwordHash,
      passwordHashStart: u.passwordHash?.substring(0, 10) || 'NONE',
    }));

    return NextResponse.json({
      count: users.length,
      users: safeUsers
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
