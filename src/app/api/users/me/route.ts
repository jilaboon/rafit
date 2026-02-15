import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAuth, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
});

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        status: true,
        emailVerifiedAt: true,
        mfaEnabled: true,
        themePreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get tenant-specific info if in tenant context
    let tenantInfo = null;
    if (session.user.tenantId) {
      const tenantUser = await prisma.tenantUser.findFirst({
        where: {
          tenantId: session.user.tenantId,
          userId: session.user.id,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          staffProfile: true,
        },
      });

      if (tenantUser) {
        tenantInfo = {
          role: tenantUser.role,
          isActive: tenantUser.isActive,
          tenant: tenantUser.tenant,
          hasStaffProfile: !!tenantUser.staffProfile,
          staffProfileId: tenantUser.staffProfile?.id,
        };
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        tenantInfo,
      },
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, phone, themePreference } = parsed.data;

    // Get current user for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, phone: true, themePreference: true },
    });

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (themePreference !== undefined) updateData.themePreference = themePreference;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'user.profile_update',
      entityType: 'user',
      entityId: session.user.id,
      oldValues: currentUser || undefined,
      newValues: updateData,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'הפרופיל עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
