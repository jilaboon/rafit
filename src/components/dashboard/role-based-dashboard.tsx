'use client';

import { UserRole } from '@prisma/client';
import {
  AdminDashboard,
  OperationsDashboard,
  CoachDashboard,
  FinanceDashboard,
  ReadOnlyDashboard,
} from './views';

interface RoleBasedDashboardProps {
  role: UserRole;
}

export function RoleBasedDashboard({ role }: RoleBasedDashboardProps) {
  // Map roles to dashboard views
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
    case 'REGIONAL_MANAGER':
      return <AdminDashboard />;

    case 'MANAGER':
    case 'FRONT_DESK':
      return <OperationsDashboard />;

    case 'COACH':
      return <CoachDashboard />;

    case 'ACCOUNTANT':
      return <FinanceDashboard />;

    case 'READ_ONLY':
    default:
      return <ReadOnlyDashboard />;
  }
}
