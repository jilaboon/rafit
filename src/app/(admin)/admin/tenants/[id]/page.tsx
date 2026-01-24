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
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  SUSPENDED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <Badge
              variant="outline"
              className={cn('capitalize', statusColors[tenant.status])}
            >
              {tenant.status.toLowerCase()}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">{tenant.slug}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Users
            </CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {tenant.tenantUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Branches
            </CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {tenant.branches.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Services
            </CardTitle>
            <Layers className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {tenant._count.services}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Tenant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="text-white">{tenant.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="text-white">{tenant.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Timezone</p>
              <p className="text-white">{tenant.timezone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Currency</p>
              <p className="text-white">{tenant.currency}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created</p>
              <p className="text-white">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Locale</p>
              <p className="text-white">{tenant.locale}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.tenantUsers.map((tu) => (
              <div
                key={tu.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-white">{tu.user.name}</p>
                  <p className="text-sm text-slate-500">{tu.user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-slate-400">
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
              <p className="text-slate-500 text-center py-4">
                No users
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branches */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-white">{branch.name}</p>
                  <p className="text-sm text-slate-500">{branch.city || branch.slug}</p>
                </div>
                <Badge
                  variant="outline"
                  className={branch.isActive ? 'text-green-400' : 'text-slate-500'}
                >
                  {branch.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
            {tenant.branches.length === 0 && (
              <p className="text-slate-500 text-center py-4">
                No branches
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
