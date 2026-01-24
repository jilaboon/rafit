import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['GROUP_CLASS', 'PERSONAL', 'WORKSHOP', 'COURSE']).default('GROUP_CLASS'),
  duration: z.number().int().min(5).max(480).default(60),
  defaultCapacity: z.number().int().min(1).max(1000).default(20),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  price: z.number().min(0).optional(),
  creditCost: z.number().int().min(0).default(1),
  isActive: z.boolean().default(true),
});

// GET /api/services - List services
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('service:read');

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      deletedAt: null,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        _count: {
          select: {
            classTemplates: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    // Get class counts for each service
    const serviceIds = services.map((s) => s.id);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const classCounts = await prisma.classTemplate.groupBy({
      by: ['serviceId'],
      where: {
        serviceId: { in: serviceIds },
        isActive: true,
      },
      _count: true,
    });

    const classCountMap = new Map(classCounts.map((c) => [c.serviceId, c._count]));

    const formattedServices = services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      type: service.type,
      duration: service.duration,
      defaultCapacity: service.defaultCapacity,
      color: service.color,
      price: service.price ? Number(service.price) : null,
      creditCost: service.creditCost,
      isActive: service.isActive,
      classCount: classCountMap.get(service.id) || 0,
      createdAt: service.createdAt,
    }));

    return NextResponse.json({ services: formattedServices });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת השירותים' },
      { status: 500 }
    );
  }
}

// POST /api/services - Create service
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('service:create');

    const body = await request.json();
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const service = await prisma.service.create({
      data: {
        tenantId: session.user.tenantId!,
        name: data.name,
        description: data.description,
        type: data.type,
        duration: data.duration,
        defaultCapacity: data.defaultCapacity,
        color: data.color,
        price: data.price,
        creditCost: data.creditCost,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'service.create',
      entityType: 'service',
      entityId: service.id,
      newValues: {
        name: data.name,
        type: data.type,
      },
    });

    return NextResponse.json(
      {
        success: true,
        service,
        message: 'השירות נוצר בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת השירות' },
      { status: 500 }
    );
  }
}
