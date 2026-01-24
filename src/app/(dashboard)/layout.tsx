import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
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

  // Redirect super admin without tenant context to admin dashboard
  if (session.user.isSuperAdmin && !session.user.tenantId && !session.user.isImpersonating) {
    redirect('/admin');
  }

  return (
    <>
      {/* Show impersonation banner if super admin is impersonating */}
      {session.user.isImpersonating && (
        <ImpersonationBanner impersonatedUserId={session.user.impersonatedUserId} />
      )}
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </>
  );
}
