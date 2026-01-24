import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError, AuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';
import { hashPassword } from '@/lib/auth/config';
import { roleOutranks, getAssignableRoles } from '@/lib/auth/rbac';

const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.nativeEnum(UserRole),
  sendInvite: z.boolean().default(true),
});

// GET /api/tenants/users - List team members
export async function GET() {
  try {
    const session = await requirePermission('user:read');

    const tenantUsers = await prisma.tenantUser.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
          },
        },
        staffProfile: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to a cleaner format
    const users = tenantUsers.map((tu) => ({
      id: tu.id,
      tenantUserId: tu.id,
      userId: tu.user.id,
      email: tu.user.email,
      name: tu.user.name,
      phone: tu.user.phone,
      avatarUrl: tu.user.avatarUrl,
      role: tu.role,
      isActive: tu.isActive,
      userStatus: tu.user.status,
      joinedAt: tu.createdAt,
      hasStaffProfile: !!tu.staffProfile,
      staffProfileTitle: tu.staffProfile?.title,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/tenants/users - Invite a new user
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('user:create');

    const body = await request.json();
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, name, role, sendInvite } = parsed.data;
    const currentUserRole = session.user.role as UserRole;

    // Check if user can assign this role
    const assignableRoles = getAssignableRoles(currentUserRole);
    if (!assignableRoles.includes(role) && role !== currentUserRole) {
      return NextResponse.json(
        { error: 'You cannot assign a role equal or higher than your own' },
        { status: 403 }
      );
    }

    // Check if user already exists in tenant
    const existingTenantUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId: session.user.tenantId,
        user: { email },
      },
    });

    if (existingTenantUser) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 409 }
      );
    }

    // Check if user exists in system
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Create user if doesn't exist
    if (!user) {
      // Generate a temporary password (user will need to reset)
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      const passwordHash = await hashPassword(tempPassword);

      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          status: 'ACTIVE',
        },
      });
    }

    // Create tenant user link
    const tenantUser = await prisma.tenantUser.create({
      data: {
        tenantId: session.user.tenantId!,
        userId: user.id,
        role,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'user.invite',
      entityType: 'tenantUser',
      entityId: tenantUser.id,
      newValues: {
        email,
        name,
        role,
      },
    });

    // TODO: Send invitation email if sendInvite is true
    if (sendInvite) {
      // Implement email sending
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: tenantUser.id,
          tenantUserId: tenantUser.id,
          userId: tenantUser.user.id,
          email: tenantUser.user.email,
          name: tenantUser.user.name,
          role: tenantUser.role,
          isActive: tenantUser.isActive,
        },
        message: 'User invited successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
