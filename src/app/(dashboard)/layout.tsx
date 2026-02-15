import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import prisma from '@/lib/db';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ImpersonationBanner } from '@/components/admin/impersonation-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Redirect customers to portal
  if (session.user.isCustomer) {
    redirect('/portal');
  }

  // Redirect super admin without tenant context to admin dashboard
  if (session.user.isSuperAdmin && !session.user.tenantId && !session.user.isImpersonating) {
    redirect('/admin');
  }

  // Fetch tenant name for display in sidebar
  let tenantName: string | undefined;
  if (session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });
    tenantName = tenant?.name ?? undefined;
  }

  return (
    <>
      {/* Show impersonation banner if super admin is impersonating */}
      {session.user.isImpersonating && (
        <ImpersonationBanner impersonatedUserId={session.user.impersonatedUserId} />
      )}
      <DashboardShell user={session.user} tenantName={tenantName}>{children}</DashboardShell>
    </>
  );
}
