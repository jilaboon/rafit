import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission, handleAuthError } from '@/lib/auth/permissions';
import { LeadStatus } from '@prisma/client';

// GET /api/leads - List leads (pre-conversion customers)
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('lead:read');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      deletedAt: null,
      leadStatus: { not: 'CONVERTED' as LeadStatus },
    };

    if (status) {
      where.leadStatus = status.toUpperCase() as LeadStatus;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [leads, total, statusCounts] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          leadActivities: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              type: true,
              description: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
      // Count leads by status for pipeline stats
      prisma.customer.groupBy({
        by: ['leadStatus'],
        where: {
          tenantId: session.user.tenantId,
          deletedAt: null,
        },
        _count: { id: true },
      }),
    ]);

    const statusCountMap: Record<string, number> = {};
    for (const sc of statusCounts) {
      statusCountMap[sc.leadStatus] = sc._count.id;
    }

    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      leadStatus: lead.leadStatus,
      tags: lead.tags,
      createdAt: lead.createdAt,
      lastActivity: lead.leadActivities[0] || null,
    }));

    return NextResponse.json({
      leads: formattedLeads,
      total,
      limit,
      offset,
      statusCounts: statusCountMap,
    });
  } catch (error) {
    const { error: message, status } = handleAuthError(error);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בטעינת הלידים' },
      { status: 500 }
    );
  }
}
