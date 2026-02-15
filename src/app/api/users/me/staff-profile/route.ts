import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireTenant, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const updateStaffProfileSchema = z.object({
  title: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional().nullable(),
  color: z.string().max(7).optional().nullable(),
  isPublic: z.boolean().optional(),
});

// GET /api/users/me/staff-profile - Get current user's staff profile
export async function GET() {
  try {
    const session = await requireTenant();

    // Find the tenant user record
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
      },
      include: {
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
      return NextResponse.json({ error: 'User not found in tenant' }, { status: 404 });
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
      staffProfile: tenantUser.staffProfile,
      branches,
      tenantUserId: tenantUser.id,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT /api/users/me/staff-profile - Create or update staff profile
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant();

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
        tenantId: session.user.tenantId,
        userId: session.user.id,
      },
      include: {
        staffProfile: true,
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'User not found in tenant' }, { status: 404 });
    }

    // Check if user has a coach-like role
    const coachRoles = ['OWNER', 'ADMIN', 'REGIONAL_MANAGER', 'MANAGER', 'COACH'];
    if (!coachRoles.includes(tenantUser.role)) {
      return NextResponse.json(
        { error: 'Only coaches and managers can have staff profiles' },
        { status: 403 }
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
      message: 'הפרופיל עודכן בהצלחה',
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
