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
        hasAllPermissions(UserRole.NETWORK_MANAGER, ['customer:read', 'customer:create'])
      ).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      expect(
        hasAllPermissions(UserRole.COACH, ['schedule:read', 'schedule:create'])
      ).toBe(false);
    });
  });

  describe('roleOutranks', () => {
    it('should return true for owner over network manager', () => {
      expect(roleOutranks(UserRole.OWNER, UserRole.NETWORK_MANAGER)).toBe(true);
    });

    it('should return true for network manager over manager', () => {
      expect(roleOutranks(UserRole.NETWORK_MANAGER, UserRole.MANAGER)).toBe(true);
    });

    it('should return false for equal roles', () => {
      expect(roleOutranks(UserRole.NETWORK_MANAGER, UserRole.NETWORK_MANAGER)).toBe(false);
    });

    it('should return false for lower role', () => {
      expect(roleOutranks(UserRole.COACH, UserRole.NETWORK_MANAGER)).toBe(false);
    });
  });

  describe('getAssignableRoles', () => {
    it('should return all lower roles for owner', () => {
      const roles = getAssignableRoles(UserRole.OWNER);
      expect(roles).toContain(UserRole.NETWORK_MANAGER);
      expect(roles).toContain(UserRole.MANAGER);
      expect(roles).toContain(UserRole.COACH);
      expect(roles).not.toContain(UserRole.OWNER);
    });

    it('should return limited roles for network manager', () => {
      const roles = getAssignableRoles(UserRole.NETWORK_MANAGER);
      expect(roles).toContain(UserRole.MANAGER);
      expect(roles).toContain(UserRole.COACH);
      expect(roles).not.toContain(UserRole.OWNER);
      expect(roles).not.toContain(UserRole.NETWORK_MANAGER);
    });

    it('should return empty array for read-only', () => {
      const roles = getAssignableRoles(UserRole.READ_ONLY);
      expect(roles).toHaveLength(0);
    });
  });

  describe('NETWORK_MANAGER permissions', () => {
    it('should have tenant read and update permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'tenant:read')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'tenant:update')).toBe(true);
    });

    it('should have branch management permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'branch:create')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'branch:delete')).toBe(true);
    });

    it('should have full user management permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'user:create')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'user:update')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'user:delete')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'user:role')).toBe(true);
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

    it('should have report and audit permissions', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'report:revenue')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'report:export')).toBe(true);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'audit:read')).toBe(true);
    });

    it('should NOT have tenant delete or billing', () => {
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'tenant:delete')).toBe(false);
      expect(hasPermission(UserRole.NETWORK_MANAGER, 'tenant:billing')).toBe(false);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should have owner with all permissions', () => {
      const ownerPermissions = ROLE_PERMISSIONS[UserRole.OWNER];
      expect(ownerPermissions.length).toBeGreaterThan(30);
    });

    it('should have network manager without tenant:delete', () => {
      const nmPermissions = ROLE_PERMISSIONS[UserRole.NETWORK_MANAGER];
      expect(nmPermissions).not.toContain('tenant:delete');
      expect(nmPermissions).not.toContain('tenant:billing');
    });

    it('should have accountant with read-only financial access', () => {
      const accountantPermissions = ROLE_PERMISSIONS[UserRole.ACCOUNTANT];
      expect(accountantPermissions).toContain('payment:read');
      expect(accountantPermissions).not.toContain('payment:refund');
    });
  });
});
