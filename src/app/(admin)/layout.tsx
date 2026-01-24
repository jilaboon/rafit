import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Require authentication
  if (!session?.user) {
    redirect('/login');
  }

  // Require super admin
  if (!session.user.isSuperAdmin) {
    redirect('/dashboard');
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
