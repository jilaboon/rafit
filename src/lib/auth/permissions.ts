import { UserRole } from '@prisma/client';
import { auth } from './config';
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getEffectivePermissions,
  ROLE_PERMISSIONS,
} from './rbac';

/**
 * Get the current user's session with role information.
 * Returns null if not authenticated.
 */
export async function getAuthSession() {
  const session = await auth();
  return session;
}

/**
 * Check if the current user has a specific permission.
 * Returns false if not authenticated or no role.
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.role) return false;
  return hasPermission(session.user.role as UserRole, permission);
}

/**
 * Check if the current user has any of the specified permissions.
 */
export async function checkAnyPermission(permissions: Permission[]): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.role) return false;
  return hasAnyPermission(session.user.role as UserRole, permissions);
}

/**
 * Check if the current user has all of the specified permissions.
 */
export async function checkAllPermissions(permissions: Permission[]): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.role) return false;
  return hasAllPermissions(session.user.role as UserRole, permissions);
}

/**
 * Get all permissions for the current user.
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const session = await auth();
  if (!session?.user?.role) return [];
  return getEffectivePermissions(session.user.role as UserRole);
}

/**
 * Require authentication and return session.
 * Throws an error if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError('Unauthorized', 401);
  }
  return session;
}

/**
 * Require authentication and tenant context.
 * Throws an error if not authenticated or no tenant.
 */
export async function requireTenant() {
  const session = await requireAuth();
  if (!session.user.tenantId) {
    throw new AuthError('No tenant context', 403);
  }
  return session;
}

/**
 * Require a specific permission.
 * Throws an error if the user doesn't have the permission.
 */
export async function requirePermission(permission: Permission) {
  const session = await requireTenant();
  if (!session.user.role) {
    throw new AuthError('No role assigned', 403);
  }
  if (!hasPermission(session.user.role as UserRole, permission)) {
    throw new AuthError(`Permission denied: ${permission}`, 403);
  }
  return session;
}

/**
 * Require any of the specified permissions.
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const session = await requireTenant();
  if (!session.user.role) {
    throw new AuthError('No role assigned', 403);
  }
  if (!hasAnyPermission(session.user.role as UserRole, permissions)) {
    throw new AuthError(`Permission denied: requires one of ${permissions.join(', ')}`, 403);
  }
  return session;
}

/**
 * Require all of the specified permissions.
 */
export async function requireAllPermissions(permissions: Permission[]) {
  const session = await requireTenant();
  if (!session.user.role) {
    throw new AuthError('No role assigned', 403);
  }
  if (!hasAllPermissions(session.user.role as UserRole, permissions)) {
    throw new AuthError(`Permission denied: requires all of ${permissions.join(', ')}`, 403);
  }
  return session;
}

/**
 * Require a specific role or higher.
 */
export async function requireRole(minRole: UserRole) {
  const session = await requireTenant();
  if (!session.user.role) {
    throw new AuthError('No role assigned', 403);
  }

  const roleHierarchy: Record<UserRole, number> = {
    OWNER: 100,
    NETWORK_MANAGER: 90,
    MANAGER: 70,
    COACH: 50,
    FRONT_DESK: 40,
    ACCOUNTANT: 30,
    READ_ONLY: 10,
  };

  const userLevel = roleHierarchy[session.user.role as UserRole] || 0;
  const requiredLevel = roleHierarchy[minRole] || 0;

  if (userLevel < requiredLevel) {
    throw new AuthError(`Requires ${minRole} role or higher`, 403);
  }
  return session;
}

/**
 * Custom error class for authentication/authorization errors.
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Helper to handle auth errors in API routes.
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return { error: error.message, status: error.statusCode };
  }
  console.error('Auth error:', error);
  return { error: 'Internal server error', status: 500 };
}

/**
 * Get role permissions for display purposes.
 */
export function getRolePermissionsList(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
