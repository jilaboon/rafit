import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Users, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImpersonateButton } from '@/components/admin/impersonate-button';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-600 border-green-500/30',
  SUSPENDED: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  CANCELLED: 'bg-red-500/20 text-red-600 border-red-500/30',
};

async function getTenant(id: string) {
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
              isSuperAdmin: true,
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

  return tenant;
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <Badge
              variant="outline"
              className={cn('capitalize', statusColors[tenant.status])}
            >
              {tenant.status === 'ACTIVE' ? 'פעיל' : tenant.status === 'SUSPENDED' ? 'מושהה' : 'מבוטל'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{tenant.slug}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              משתמשים
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenant.tenantUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סניפים
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenant.branches.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              שירותים
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenant._count.services}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>פרטי העסק</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">אימייל</p>
              <p>{tenant.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">טלפון</p>
              <p>{tenant.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">אזור זמן</p>
              <p>{tenant.timezone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">מטבע</p>
              <p>{tenant.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">נוצר</p>
              <p>
                {new Date(tenant.createdAt).toLocaleDateString('he-IL')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">שפה</p>
              <p>{tenant.locale}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>משתמשים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.tenantUsers.map((tu) => (
              <div
                key={tu.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">{tu.user.name}</p>
                  <p className="text-sm text-muted-foreground">{tu.user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {tu.role}
                  </Badge>
                  {!tu.user.isSuperAdmin && (
                    <ImpersonateButton
                      userId={tu.user.id}
                      userName={tu.user.name}
                    />
                  )}
                </div>
              </div>
            ))}
            {tenant.tenantUsers.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                אין משתמשים
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branches */}
      <Card>
        <CardHeader>
          <CardTitle>סניפים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">{branch.name}</p>
                  <p className="text-sm text-muted-foreground">{branch.city || branch.slug}</p>
                </div>
                <Badge
                  variant="outline"
                  className={branch.isActive ? 'text-green-600' : 'text-muted-foreground'}
                >
                  {branch.isActive ? 'פעיל' : 'לא פעיל'}
                </Badge>
              </div>
            ))}
            {tenant.branches.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                אין סניפים
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
