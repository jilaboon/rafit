import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const updateStaffProfileSchema = z.object({
  title: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional().nullable(),
  color: z.string().max(7).optional().nullable(),
  isPublic: z.boolean().optional(),
  branchId: z.string().uuid().optional().nullable(),
});

// GET /api/tenants/users/[id]/staff-profile - Get a team member's staff profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('staff:read');
    const { id } = await params;

    // Find the tenant user record
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        staffProfile: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get available branches for dropdown
    const branches = await prisma.branch.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      user: {
        name: tenantUser.user.name,
        email: tenantUser.user.email,
        role: tenantUser.role,
      },
      staffProfile: tenantUser.staffProfile,
      branches,
      tenantUserId: tenantUser.id,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT /api/tenants/users/[id]/staff-profile - Create or update a team member's staff profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('staff:update');
    const { id } = await params;

    const body = await request.json();
    const parsed = updateStaffProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Find the tenant user record
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        staffProfile: true,
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a coach-like role
    const coachRoles = ['OWNER', 'ADMIN', 'REGIONAL_MANAGER', 'MANAGER', 'COACH'];
    if (!coachRoles.includes(tenantUser.role)) {
      return NextResponse.json(
        { error: 'Only coaches and managers can have staff profiles' },
        { status: 400 }
      );
    }

    let staffProfile;

    if (tenantUser.staffProfile) {
      // Update existing profile
      staffProfile = await prisma.staffProfile.update({
        where: { id: tenantUser.staffProfile.id },
        data: {
          title: data.title,
          bio: data.bio,
          specialties: data.specialties,
          certifications: data.certifications,
          hourlyRate: data.hourlyRate,
          color: data.color,
          isPublic: data.isPublic,
          branchId: data.branchId,
        },
      });

      await createAuditLog({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'staff.profile_update',
        entityType: 'staffProfile',
        entityId: staffProfile.id,
        oldValues: tenantUser.staffProfile,
        newValues: data,
      });
    } else {
      // Create new profile
      staffProfile = await prisma.staffProfile.create({
        data: {
          tenantUserId: tenantUser.id,
          branchId: data.branchId,
          title: data.title,
          bio: data.bio,
          specialties: data.specialties || [],
          certifications: data.certifications || [],
          hourlyRate: data.hourlyRate,
          color: data.color,
          isPublic: data.isPublic ?? true,
        },
      });

      await createAuditLog({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'staff.profile_create',
        entityType: 'staffProfile',
        entityId: staffProfile.id,
        newValues: data,
      });
    }

    return NextResponse.json({
      success: true,
      staffProfile,
      message: 'פרופיל המדריך עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/tenants/users/[id]/staff-profile - Delete a staff profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('staff:delete');
    const { id } = await params;

    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        staffProfile: true,
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!tenantUser.staffProfile) {
      return NextResponse.json({ error: 'No staff profile to delete' }, { status: 404 });
    }

    await prisma.staffProfile.delete({
      where: { id: tenantUser.staffProfile.id },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'staff.profile_delete',
      entityType: 'staffProfile',
      entityId: tenantUser.staffProfile.id,
      oldValues: tenantUser.staffProfile,
    });

    return NextResponse.json({
      success: true,
      message: 'פרופיל המדריך נמחק',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
