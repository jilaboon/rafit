import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { createAuditLog } from '@/lib/security/audit';

const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  timezone: z.string().default('Asia/Jerusalem'),
  currency: z.string().default('ILS'),
  locale: z.string().default('he'),
});

// GET /api/admin/tenants - List all tenants (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          status: true,
          timezone: true,
          currency: true,
          createdAt: true,
          _count: {
            select: {
              tenantUsers: true,
              branches: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tenants - Create new tenant (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug already in use' },
        { status: 409 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        ...parsed.data,
        settings: {},
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'admin.tenant_create',
      entityType: 'tenant',
      entityId: tenant.id,
      newValues: {
        name: tenant.name,
        slug: tenant.slug,
      },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
