import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  roleOutranks,
  getAssignableRoles,
  ROLE_PERMISSIONS,
} from '@/lib/auth/rbac';
import { UserRole } from '@prisma/client';

describe('RBAC', () => {
  describe('hasPermission', () => {
    it('should return true for owner with any permission', () => {
      expect(hasPermission(UserRole.OWNER, 'tenant:delete')).toBe(true);
      expect(hasPermission(UserRole.OWNER, 'user:role')).toBe(true);
      expect(hasPermission(UserRole.OWNER, 'payment:refund')).toBe(true);
    });

    it('should return false for read-only with write permissions', () => {
      expect(hasPermission(UserRole.READ_ONLY, 'customer:create')).toBe(false);
      expect(hasPermission(UserRole.READ_ONLY, 'booking:cancel')).toBe(false);
    });

    it('should return true for read-only with read permissions', () => {
      expect(hasPermission(UserRole.READ_ONLY, 'customer:read')).toBe(true);
      expect(hasPermission(UserRole.READ_ONLY, 'schedule:read')).toBe(true);
    });

    it('should return correct permissions for coach', () => {
      expect(hasPermission(UserRole.COACH, 'schedule:read')).toBe(true);
      expect(hasPermission(UserRole.COACH, 'booking:checkin')).toBe(true);
      expect(hasPermission(UserRole.COACH, 'schedule:create')).toBe(false);
    });

    it('should return correct permissions for front desk', () => {
      expect(hasPermission(UserRole.FRONT_DESK, 'booking:create')).toBe(true);
      expect(hasPermission(UserRole.FRONT_DESK, 'booking:checkin')).toBe(true);
      expect(hasPermission(UserRole.FRONT_DESK, 'payment:refund')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      expect(
        hasAnyPermission(UserRole.COACH, ['schedule:read', 'schedule:create'])
      ).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(
        hasAnyPermission(UserRole.READ_ONLY, ['customer:create', 'booking:create'])
      ).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      expect(
        hasAllPermissions(UserRole.ADMIN, ['customer:read', 'customer:create'])
      ).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      expect(
        hasAllPermissions(UserRole.COACH, ['schedule:read', 'schedule:create'])
      ).toBe(false);
    });
  });

  describe('roleOutranks', () => {
    it('should return true for owner over admin', () => {
      expect(roleOutranks(UserRole.OWNER, UserRole.ADMIN)).toBe(true);
    });

    it('should return true for admin over manager', () => {
      expect(roleOutranks(UserRole.ADMIN, UserRole.MANAGER)).toBe(true);
    });

    it('should return false for equal roles', () => {
      expect(roleOutranks(UserRole.ADMIN, UserRole.ADMIN)).toBe(false);
    });

    it('should return false for lower role', () => {
      expect(roleOutranks(UserRole.COACH, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('getAssignableRoles', () => {
    it('should return all lower roles for owner', () => {
      const roles = getAssignableRoles(UserRole.OWNER);
      expect(roles).toContain(UserRole.ADMIN);
      expect(roles).toContain(UserRole.MANAGER);
      expect(roles).toContain(UserRole.COACH);
      expect(roles).not.toContain(UserRole.OWNER);
    });

    it('should return limited roles for admin', () => {
      const roles = getAssignableRoles(UserRole.ADMIN);
      expect(roles).toContain(UserRole.MANAGER);
      expect(roles).toContain(UserRole.COACH);
      expect(roles).not.toContain(UserRole.OWNER);
      expect(roles).not.toContain(UserRole.ADMIN);
    });

    it('should return empty array for read-only', () => {
      const roles = getAssignableRoles(UserRole.READ_ONLY);
      expect(roles).toHaveLength(0);
    });
  });

  describe('NETWORK_MANAGER permissions', () => {
    it('should have branch management permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'branch:create')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'branch:delete')).toBe(true);
    });

    it('should have staff management permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'staff:create')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'staff:delete')).toBe(true);
    });

    it('should have customer management permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'customer:delete')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'customer:export')).toBe(true);
    });

    it('should have automation permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'automation:create')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'automation:delete')).toBe(true);
    });

    it('should have report permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'report:revenue')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'report:export')).toBe(true);
    });

    it('should NOT have tenant management permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'tenant:update')).toBe(false);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'tenant:delete')).toBe(false);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'tenant:billing')).toBe(false);
    });

    it('should NOT have user update/delete/role permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'user:update')).toBe(false);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'user:delete')).toBe(false);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'user:role')).toBe(false);
    });

    it('should NOT have audit:read permission', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'audit:read')).toBe(false);
    });
  });

  describe('NETWORK_MANAGER hierarchy', () => {
    it('should be outranked by ADMIN', () => {
      expect(roleOutranks(UserRole.ADMIN, UserRole.NETWORK_MANAGER)).toBe(true);
    });

    it('should outrank MANAGER', () => {
      expect(roleOutranks(UserRole.NETWORK_MANAGER, UserRole.MANAGER)).toBe(true);
    });
  });

  describe('NETWORK_MANAGER assignable roles', () => {
    it('OWNER should be able to assign NETWORK_MANAGER', () => {
      const roles = getAssignableRoles(UserRole.OWNER);
      expect(roles).toContain(UserRole.NETWORK_MANAGER);
    });

    it('ADMIN should be able to assign NETWORK_MANAGER', () => {
      const roles = getAssignableRoles(UserRole.ADMIN);
      expect(roles).toContain(UserRole.NETWORK_MANAGER);
    });

    it('NETWORK_MANAGER should be able to assign MANAGER and COACH', () => {
      const roles = getAssignableRoles(UserRole.NETWORK_MANAGER);
      expect(roles).toContain(UserRole.MANAGER);
      expect(roles).toContain(UserRole.COACH);
    });

    it('NETWORK_MANAGER should NOT be able to assign ADMIN or itself', () => {
      const roles = getAssignableRoles(UserRole.NETWORK_MANAGER);
      expect(roles).not.toContain(UserRole.ADMIN);
      expect(roles).not.toContain(UserRole.NETWORK_MANAGER);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should have owner with all permissions', () => {
      const ownerPermissions = ROLE_PERMISSIONS[UserRole.OWNER];
      expect(ownerPermissions.length).toBeGreaterThan(30);
    });

    it('should have admin without tenant:delete', () => {
      const adminPermissions = ROLE_PERMISSIONS[UserRole.ADMIN];
      expect(adminPermissions).not.toContain('tenant:delete');
      expect(adminPermissions).not.toContain('tenant:billing');
    });

    it('should have accountant with read-only financial access', () => {
      const accountantPermissions = ROLE_PERMISSIONS[UserRole.ACCOUNTANT];
      expect(accountantPermissions).toContain('payment:read');
      expect(accountantPermissions).not.toContain('payment:refund');
    });
  });
});
