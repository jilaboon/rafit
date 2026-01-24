import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { RoleBasedDashboard } from '@/components/dashboard/role-based-dashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get user role with fallback
  const role = (session.user.role as UserRole) || 'READ_ONLY';

  return <RoleBasedDashboard role={role} />;
}
