import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError, AuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';
import { roleOutranks, getAssignableRoles, ROLE_HIERARCHY } from '@/lib/auth/rbac';

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/tenants/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('user:read');
    const { id } = await params;

    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        id,
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
            bio: true,
            specialties: true,
          },
        },
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: tenantUser.id,
        tenantUserId: tenantUser.id,
        userId: tenantUser.user.id,
        email: tenantUser.user.email,
        name: tenantUser.user.name,
        phone: tenantUser.user.phone,
        avatarUrl: tenantUser.user.avatarUrl,
        role: tenantUser.role,
        isActive: tenantUser.isActive,
        userStatus: tenantUser.user.status,
        joinedAt: tenantUser.createdAt,
        staffProfile: tenantUser.staffProfile,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/tenants/users/[id] - Update user role or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('user:role');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { role, isActive } = parsed.data;
    const currentUserRole = session.user.role as UserRole;

    // Get target user
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-demotion
    if (tenantUser.userId === session.user.id && role && role !== tenantUser.role) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    // Check if current user outranks target user
    if (!roleOutranks(currentUserRole, tenantUser.role) && currentUserRole !== tenantUser.role) {
      return NextResponse.json(
        { error: 'You cannot modify a user with equal or higher role' },
        { status: 403 }
      );
    }

    // If changing role, validate the new role is assignable
    if (role) {
      const assignableRoles = getAssignableRoles(currentUserRole);
      // Owner can assign ADMIN, others can only assign roles below them
      if (currentUserRole === 'OWNER') {
        // Owner can assign any role except OWNER
        if (role === 'OWNER' && tenantUser.role !== 'OWNER') {
          return NextResponse.json(
            { error: 'Cannot assign OWNER role' },
            { status: 403 }
          );
        }
      } else if (!assignableRoles.includes(role)) {
        return NextResponse.json(
          { error: 'You cannot assign this role' },
          { status: 403 }
        );
      }
    }

    // Update tenant user
    const updatedTenantUser = await prisma.tenantUser.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'user.role_change',
      entityType: 'tenantUser',
      entityId: tenantUser.id,
      oldValues: {
        role: tenantUser.role,
        isActive: tenantUser.isActive,
      },
      newValues: {
        role: updatedTenantUser.role,
        isActive: updatedTenantUser.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedTenantUser.id,
        email: updatedTenantUser.user.email,
        name: updatedTenantUser.user.name,
        role: updatedTenantUser.role,
        isActive: updatedTenantUser.isActive,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/tenants/users/[id] - Remove user from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('user:delete');
    const { id } = await params;
    const currentUserRole = session.user.role as UserRole;

    // Get target user
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-removal
    if (tenantUser.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the team' },
        { status: 403 }
      );
    }

    // Check if current user outranks target user
    if (!roleOutranks(currentUserRole, tenantUser.role)) {
      return NextResponse.json(
        { error: 'You cannot remove a user with equal or higher role' },
        { status: 403 }
      );
    }

    // Prevent removing the last owner
    if (tenantUser.role === 'OWNER') {
      const ownerCount = await prisma.tenantUser.count({
        where: {
          tenantId: session.user.tenantId,
          role: 'OWNER',
          isActive: true,
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner' },
          { status: 403 }
        );
      }
    }

    // Soft delete by setting isActive to false (or hard delete)
    await prisma.tenantUser.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'user.delete',
      entityType: 'tenantUser',
      entityId: id,
      oldValues: {
        email: tenantUser.user.email,
        name: tenantUser.user.name,
        role: tenantUser.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
