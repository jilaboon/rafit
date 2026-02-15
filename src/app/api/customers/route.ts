import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { createAuditLog } from '@/lib/security/audit';

const createCustomerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  medicalNotes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
  marketingConsent: z.boolean().default(false),
});

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('customer:read');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.leadStatus = status.toUpperCase();
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          memberships: {
            where: { status: 'ACTIVE' },
            include: {
              plan: {
                select: {
                  name: true,
                  type: true,
                },
              },
            },
            take: 1,
          },
          bookings: {
            where: {
              status: 'COMPLETED',
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              bookings: {
                where: {
                  checkedInAt: { not: null },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ]);

    // Get last visit for each customer
    const customerIds = customers.map((c) => c.id);
    const lastVisits = await prisma.booking.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: customerIds },
        checkedInAt: { not: null },
      },
      _max: {
        checkedInAt: true,
      },
    });

    const lastVisitMap = new Map(
      lastVisits.map((v) => [v.customerId, v._max.checkedInAt])
    );

    const formattedCustomers = customers.map((customer) => {
      const activeMembership = customer.memberships[0];
      let membershipStatus = 'lead';

      if (activeMembership) {
        if (activeMembership.plan.type === 'TRIAL') {
          membershipStatus = 'trial';
        } else {
          membershipStatus = 'active';
        }
      } else if (customer._count.bookings > 0) {
        membershipStatus = 'expired';
      }

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        tags: customer.tags,
        leadStatus: customer.leadStatus,
        membershipStatus,
        activeMembership: activeMembership
          ? {
              planName: activeMembership.plan.name,
              planType: activeMembership.plan.type,
              sessionsRemaining: activeMembership.sessionsRemaining,
              creditsRemaining: activeMembership.creditsRemaining,
            }
          : null,
        totalVisits: customer._count.bookings,
        lastVisit: lastVisitMap.get(customer.id) || null,
        createdAt: customer.createdAt,
      };
    });

    return NextResponse.json({
      customers: formattedCustomers,
      total,
      limit,
      offset,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הלקוחות' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('customer:create');

    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if customer already exists
    const existing = await prisma.customer.findFirst({
      where: {
        tenantId: session.user.tenantId,
        email: data.email,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'לקוח עם אימייל זה כבר קיים' },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: session.user.tenantId!,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        notes: data.notes,
        tags: data.tags,
        source: data.source,
        marketingConsent: data.marketingConsent,
        consentDate: data.marketingConsent ? new Date() : null,
      },
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'customer.create',
      entityType: 'customer',
      entityId: customer.id,
      newValues: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
    });

    return NextResponse.json(
      {
        success: true,
        customer,
        message: 'הלקוח נוצר בהצלחה',
      },
      { status: 201 }
    );
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה ביצירת הלקוח' },
      { status: 500 }
    );
  }
}
