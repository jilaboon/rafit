import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { createAuditLog } from '@/lib/security/audit';

const impersonateSchema = z.object({
  userId: z.string().uuid(),
});

// POST /api/admin/impersonate - Start impersonating a user (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Already impersonating
    if (session.user.isImpersonating) {
      return NextResponse.json(
        { error: 'Already impersonating a user. Stop current impersonation first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = impersonateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        status: true,
        tenantUsers: {
          where: { isActive: true },
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot impersonate other super admins
    if (targetUser.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot impersonate Super Admin users' },
        { status: 403 }
      );
    }

    // User must be active
    if (targetUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot impersonate inactive users' },
        { status: 400 }
      );
    }

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'admin.impersonate_start',
      entityType: 'user',
      entityId: targetUser.id,
      newValues: {
        impersonatedUserEmail: targetUser.email,
        impersonatedUserName: targetUser.name,
      },
    });

    // Return impersonation details for the client to update the session
    return NextResponse.json({
      success: true,
      impersonate: {
        userId: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        tenantId: targetUser.tenantUsers[0]?.tenantId,
        role: targetUser.tenantUsers[0]?.role,
        tenant: targetUser.tenantUsers[0]?.tenant,
      },
    });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/impersonate - Stop impersonating (Super Admin only)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!session.user.isImpersonating) {
      return NextResponse.json(
        { error: 'Not currently impersonating' },
        { status: 400 }
      );
    }

    // Audit log
    await createAuditLog({
      userId: session.user.originalUserId || session.user.id,
      action: 'admin.impersonate_stop',
      entityType: 'user',
      entityId: session.user.impersonatedUserId,
      metadata: {
        impersonatedUserId: session.user.impersonatedUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to stop impersonation' },
      { status: 500 }
    );
  }
}
