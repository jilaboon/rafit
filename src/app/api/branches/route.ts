import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const createBranchSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'מזהה URL יכול להכיל רק אותיות קטנות, מספרים ומקפים'),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  timezone: z.string().default('Asia/Jerusalem'),
  isActive: z.boolean().default(true),
});

// GET /api/branches - List branches
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('branch:read');

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      deletedAt: null,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            rooms: true,
            staffProfiles: true,
            classInstances: {
              where: {
                startTime: { gte: new Date() },
                isCancelled: false,
              },
            },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    const formattedBranches = branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      slug: branch.slug,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      email: branch.email,
      timezone: branch.timezone,
      isActive: branch.isActive,
      roomsCount: branch._count.rooms,
      staffCount: branch._count.staffProfiles,
      upcomingClassesCount: branch._count.classInstances,
      createdAt: branch.createdAt,
    }));

    return NextResponse.json({ branches: formattedBranches });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הסניפים' },
      { status: 500 }
    );
  }
}

// POST /api/branches - Create branch
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('branch:create');

    const body = await request.json();
    const parsed = createBranchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if slug is unique for this tenant
    const existingSlug = await prisma.branch.findFirst({
      where: {
        tenantId: session.user.tenantId,
        slug: data.slug,
        deletedAt: null,
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'מזהה URL כבר קיים' },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        tenantId: session.user.tenantId!,
        name: data.name,
        slug: data.slug,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email || null,
        timezone: data.timezone,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'branch.create',
      entityType: 'branch',
      entityId: branch.id,
      newValues: {
        name: data.name,
        slug: data.slug,
        city: data.city,
      },
    });

    return NextResponse.json(
      {
        success: true,
        branch,
        message: 'הסניף נוצר בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת הסניף' },
      { status: 500 }
    );
  }
}
