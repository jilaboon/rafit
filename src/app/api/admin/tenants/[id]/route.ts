import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { createAuditLog } from '@/lib/security/audit';

const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
});

// GET /api/admin/tenants/[id] - Get tenant details (Super Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            isActive: true,
          },
        },
        tenantUsers: {
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
        },
        _count: {
          select: {
            services: true,
            membershipPlans: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/tenants/[id] - Update tenant (Super Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get current tenant for audit log
    const currentTenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!currentTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: parsed.data,
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'admin.tenant_update',
      entityType: 'tenant',
      entityId: tenant.id,
      oldValues: {
        name: currentTenant.name,
        status: currentTenant.status,
      },
      newValues: parsed.data,
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tenants/[id] - Soft delete tenant (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Soft delete by setting status and deletedAt
    await prisma.tenant.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        deletedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'admin.tenant_delete',
      entityType: 'tenant',
      entityId: id,
      oldValues: {
        name: tenant.name,
        status: tenant.status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
