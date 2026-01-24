import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth/config';

// GET /api/admin/stats - Platform statistics (Super Admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get platform-wide statistics
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalCustomers,
      totalBookings,
      recentActivity,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.customer.count(),
      prisma.booking.count(),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    // Get tenant growth over last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newTenantsThisMonth = await prisma.tenant.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get recent logins
    const recentLogins = await prisma.auditLog.count({
      where: {
        action: 'user.login',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalTenants,
        activeTenants,
        suspendedTenants: totalTenants - activeTenants,
        totalUsers,
        totalCustomers,
        totalBookings,
        recentActivity,
        newTenantsThisMonth,
        recentLogins,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
