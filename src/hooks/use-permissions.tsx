'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getEffectivePermissions,
  ROLE_HIERARCHY,
  roleOutranks,
  getAssignableRoles,
} from '@/lib/auth/rbac';

/**
 * Hook to check user permissions in client components.
 */
export function usePermissions() {
  const { data: session, status } = useSession();

  const role = session?.user?.role as UserRole | undefined;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  /**
   * Check if the current user has a specific permission.
   */
  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Check if the current user has any of the specified permissions.
   */
  const canAny = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  };

  /**
   * Check if the current user has all of the specified permissions.
   */
  const canAll = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  };

  /**
   * Get all permissions for the current user.
   */
  const permissions = role ? getEffectivePermissions(role) : [];

  /**
   * Check if the current user's role is at least the specified role.
   */
  const isAtLeast = (minRole: UserRole): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
  };

  /**
   * Check if the current user's role outranks another role.
   */
  const outranks = (otherRole: UserRole): boolean => {
    if (!role) return false;
    return roleOutranks(role, otherRole);
  };

  /**
   * Get roles that the current user can assign to others.
   */
  const assignableRoles = role ? getAssignableRoles(role) : [];

  /**
   * Check if user is owner.
   */
  const isOwner = role === 'OWNER';

  /**
   * Check if user is admin or higher.
   */
  const isAdmin = role === 'OWNER' || role === 'ADMIN';

  /**
   * Check if user is manager or higher.
   */
  const isManager = isAdmin || role === 'MANAGER';

  return {
    // State
    role,
    permissions,
    isLoading,
    isAuthenticated,

    // Permission checks
    can,
    canAny,
    canAll,

    // Role checks
    isAtLeast,
    outranks,
    assignableRoles,
    isOwner,
    isAdmin,
    isManager,

    // Session data
    session,
    user: session?.user,
    tenantId: session?.user?.tenantId,
  };
}

/**
 * Component wrapper that only renders children if user has permission.
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  // Single permission check
  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions) {
    const hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Component wrapper that only renders children if user has role.
 */
export function RoleGate({
  role,
  fallback = null,
  children,
}: {
  role: UserRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { isAtLeast, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!isAtLeast(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
