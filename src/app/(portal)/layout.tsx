import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import prisma from '@/lib/db';
import { PortalShell } from '@/components/portal/portal-shell';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/portal/login');
  }

  if (!session.user.isCustomer) {
    redirect('/dashboard');
  }

  // Fetch tenant name for header
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.customerTenantId! },
    select: { name: true },
  });

  return (
    <PortalShell
      tenantName={tenant?.name || ''}
      userName={session.user.name || ''}
    >
      {children}
    </PortalShell>
  );
}
