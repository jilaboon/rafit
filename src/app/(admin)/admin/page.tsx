import { Building2, Users, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/db';

async function getStats() {
  const [
    totalTenants,
    activeTenants,
    totalUsers,
    totalCustomers,
    recentActivity,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count(),
    prisma.customer.count(),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Get recent tenants
  const recentTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: {
        select: { tenantUsers: true },
      },
    },
  });

  return {
    totalTenants,
    activeTenants,
    totalUsers,
    totalCustomers,
    recentActivity,
    recentTenants,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">סקירת הפלטפורמה</h1>
        <p className="text-slate-400 mt-1">
          ניטור וניהול כל העסקים בפלטפורמה
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              סה״כ עסקים
            </CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTenants}</div>
            <p className="text-xs text-slate-500">
              {stats.activeTenants} פעילים
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              סה״כ משתמשים
            </CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-slate-500">
              בכל העסקים
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              סה״כ לקוחות
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCustomers}</div>
            <p className="text-xs text-slate-500">
              בכל הפלטפורמה
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              פעילות אחרונה
            </CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.recentActivity}</div>
            <p className="text-xs text-slate-500">
              24 שעות אחרונות
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">עסקים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-white">{tenant.name}</p>
                  <p className="text-sm text-slate-500">{tenant.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    {tenant._count.tenantUsers} משתמשים
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentTenants.length === 0 && (
              <p className="text-slate-500 text-center py-4">
                אין עסקים עדיין
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
