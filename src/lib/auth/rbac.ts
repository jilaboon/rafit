import { UserRole } from '@prisma/client';

// Permission definitions
export const PERMISSIONS = {
  // Tenant management
  'tenant:read': 'View tenant settings',
  'tenant:update': 'Update tenant settings',
  'tenant:delete': 'Delete tenant',
  'tenant:billing': 'Manage billing',

  // Branch management
  'branch:create': 'Create branches',
  'branch:read': 'View branches',
  'branch:update': 'Update branches',
  'branch:delete': 'Delete branches',

  // User management
  'user:create': 'Invite users',
  'user:read': 'View users',
  'user:update': 'Update users',
  'user:delete': 'Remove users',
  'user:role': 'Change user roles',

  // Staff management
  'staff:create': 'Create staff profiles',
  'staff:read': 'View staff',
  'staff:update': 'Update staff',
  'staff:delete': 'Delete staff',

  // Customer management
  'customer:create': 'Create customers',
  'customer:read': 'View customers',
  'customer:update': 'Update customers',
  'customer:delete': 'Delete customers',
  'customer:export': 'Export customer data',

  // Service management
  'service:create': 'Create services',
  'service:read': 'View services',
  'service:update': 'Update services',
  'service:delete': 'Delete services',

  // Schedule management
  'schedule:create': 'Create classes',
  'schedule:read': 'View schedule',
  'schedule:update': 'Update classes',
  'schedule:delete': 'Delete classes',
  'schedule:cancel': 'Cancel classes',

  // Booking management
  'booking:create': 'Create bookings',
  'booking:read': 'View bookings',
  'booking:update': 'Update bookings',
  'booking:cancel': 'Cancel bookings',
  'booking:checkin': 'Check-in customers',

  // Membership management
  'membership:create': 'Create memberships',
  'membership:read': 'View memberships',
  'membership:update': 'Update memberships',
  'membership:cancel': 'Cancel memberships',

  // Payment management
  'payment:create': 'Process payments',
  'payment:read': 'View payments',
  'payment:refund': 'Process refunds',

  // Reports
  'report:revenue': 'View revenue reports',
  'report:attendance': 'View attendance reports',
  'report:members': 'View member reports',
  'report:export': 'Export reports',

  // Lead management
  'lead:read': 'View leads',
  'lead:update': 'Update lead status',
  'lead:convert': 'Convert lead to customer',

  // Task management
  'task:create': 'Create tasks',
  'task:read': 'View tasks',
  'task:update': 'Update tasks',
  'task:delete': 'Delete tasks',

  // Automation management
  'automation:create': 'Create automations',
  'automation:read': 'View automations',
  'automation:update': 'Update automations',
  'automation:delete': 'Delete automations',

  // Audit logs
  'audit:read': 'View audit logs',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: Object.keys(PERMISSIONS) as Permission[],

  NETWORK_MANAGER: [
    'tenant:read',
    'tenant:update',
    'branch:create',
    'branch:read',
    'branch:update',
    'branch:delete',
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:role',
    'staff:create',
    'staff:read',
    'staff:update',
    'staff:delete',
    'customer:create',
    'customer:read',
    'customer:update',
    'customer:delete',
    'customer:export',
    'service:create',
    'service:read',
    'service:update',
    'service:delete',
    'schedule:create',
    'schedule:read',
    'schedule:update',
    'schedule:delete',
    'schedule:cancel',
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:cancel',
    'booking:checkin',
    'membership:create',
    'membership:read',
    'membership:update',
    'membership:cancel',
    'payment:create',
    'payment:read',
    'payment:refund',
    'report:revenue',
    'report:attendance',
    'report:members',
    'report:export',
    'lead:read',
    'lead:update',
    'lead:convert',
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'automation:create',
    'automation:read',
    'automation:update',
    'automation:delete',
    'audit:read',
  ],

  MANAGER: [
    'branch:read',
    'branch:update',
    'user:read',
    'staff:read',
    'staff:update',
    'customer:create',
    'customer:read',
    'customer:update',
    'service:read',
    'service:update',
    'schedule:create',
    'schedule:read',
    'schedule:update',
    'schedule:cancel',
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:cancel',
    'booking:checkin',
    'membership:create',
    'membership:read',
    'membership:update',
    'payment:create',
    'payment:read',
    'report:attendance',
    'report:members',
    'lead:read',
    'lead:update',
    'lead:convert',
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'automation:read',
  ],

  COACH: [
    'schedule:read',
    'booking:read',
    'booking:checkin',
    'customer:read',
    'report:attendance',
    'task:read',
  ],

  FRONT_DESK: [
    'customer:create',
    'customer:read',
    'customer:update',
    'schedule:read',
    'booking:create',
    'booking:read',
    'booking:cancel',
    'booking:checkin',
    'membership:read',
    'payment:create',
    'payment:read',
    'lead:read',
    'lead:update',
    'task:create',
    'task:read',
    'task:update',
  ],

  ACCOUNTANT: [
    'customer:read',
    'membership:read',
    'payment:read',
    'report:revenue',
    'report:members',
    'report:export',
  ],

  READ_ONLY: [
    'branch:read',
    'customer:read',
    'service:read',
    'schedule:read',
    'booking:read',
    'membership:read',
    'payment:read',
    'report:revenue',
    'report:attendance',
    'report:members',
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

// Get all permissions for a role (including overrides)
export function getEffectivePermissions(
  role: UserRole,
  overrides: Record<string, boolean> = {}
): Permission[] {
  const basePermissions = ROLE_PERMISSIONS[role] || [];
  const effectivePermissions = new Set(basePermissions);

  // Apply overrides
  for (const [permission, granted] of Object.entries(overrides)) {
    if (granted) {
      effectivePermissions.add(permission as Permission);
    } else {
      effectivePermissions.delete(permission as Permission);
    }
  }

  return Array.from(effectivePermissions);
}

// Role hierarchy for comparison
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 100,
  NETWORK_MANAGER: 90,
  MANAGER: 70,
  COACH: 50,
  FRONT_DESK: 40,
  ACCOUNTANT: 30,
  READ_ONLY: 10,
};

// Check if one role outranks another
export function roleOutranks(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

// Get roles that a user can assign (only roles below their own)
export function getAssignableRoles(role: UserRole): UserRole[] {
  const currentLevel = ROLE_HIERARCHY[role];
  return (Object.keys(ROLE_HIERARCHY) as UserRole[]).filter(
    (r) => ROLE_HIERARCHY[r] < currentLevel
  );
}

// Hebrew role names
export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'בעלים',
  NETWORK_MANAGER: 'מנהל רשת',
  MANAGER: 'מנהל',
  COACH: 'מדריך',
  FRONT_DESK: 'קבלה',
  ACCOUNTANT: 'חשב',
  READ_ONLY: 'צפייה בלבד',
};

// =====================================================
// SUPER ADMIN UTILITIES
// =====================================================

/**
 * Check if a user session has super admin privileges.
 * Super admins operate outside the normal tenant/role hierarchy.
 */
export function isSuperAdmin(session: { user?: { isSuperAdmin?: boolean } } | null): boolean {
  return session?.user?.isSuperAdmin === true;
}

/**
 * Check if a user session is currently impersonating another user.
 */
export function isImpersonating(session: { user?: { isImpersonating?: boolean } } | null): boolean {
  return session?.user?.isImpersonating === true;
}

/**
 * Check if a user can be impersonated.
 * Super admins cannot be impersonated to prevent privilege escalation.
 */
export function canImpersonate(targetUser: { isSuperAdmin?: boolean }): boolean {
  return targetUser.isSuperAdmin !== true;
}

/**
 * Get the effective user ID (impersonated user if impersonating, otherwise actual user).
 */
export function getEffectiveUserId(session: {
  user?: {
    id: string;
    isImpersonating?: boolean;
    impersonatedUserId?: string;
  };
} | null): string | null {
  if (!session?.user) return null;
  if (session.user.isImpersonating && session.user.impersonatedUserId) {
    return session.user.impersonatedUserId;
  }
  return session.user.id;
}

/**
 * Get the original (non-impersonated) user ID.
 */
export function getOriginalUserId(session: {
  user?: {
    id: string;
    isImpersonating?: boolean;
    originalUserId?: string;
  };
} | null): string | null {
  if (!session?.user) return null;
  if (session.user.isImpersonating && session.user.originalUserId) {
    return session.user.originalUserId;
  }
  return session.user.id;
}
