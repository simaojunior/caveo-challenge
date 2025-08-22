import { describe, expect, it } from 'vitest';
import { UserPermission } from './user-permission';
import { InsufficientPermissionsError } from '@/domain/errors';

describe('UserPermissionService', () => {
  describe('validateEditPermissions', () => {
    describe('when user is admin', () => {
      it('should allow admin to edit other users without role change', () => {
        // Arrange
        const input = {
          isAdmin: true,
          isEditingSelf: false,
          hasRoleChange: false,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).not.toThrow();
      });

      it('should allow admin to edit other users with role change', () => {
        // Arrange
        const input = {
          isAdmin: true,
          isEditingSelf: false,
          hasRoleChange: true,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).not.toThrow();
      });

      it('should allow admin to edit themselves without role change', () => {
        // Arrange
        const input = {
          isAdmin: true,
          isEditingSelf: true,
          hasRoleChange: false,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).not.toThrow();
      });

      it('should allow admin to edit themselves with role change', () => {
        // Arrange
        const input = {
          isAdmin: true,
          isEditingSelf: true,
          hasRoleChange: true,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).not.toThrow();
      });
    });

    describe('when user is regular user', () => {
      it('should allow regular user to edit themselves without role change', () => {
        // Arrange
        const input = {
          isAdmin: false,
          isEditingSelf: true,
          hasRoleChange: false,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).not.toThrow();
      });

      it('should throw when regular user tries to edit other users', () => {
        // Arrange
        const input = {
          isAdmin: false,
          isEditingSelf: false,
          hasRoleChange: false,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).toThrow(InsufficientPermissionsError);

        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).toThrow('You do not have permission to edit other users');
      });

      it('should throw when regular user tries to change role on themselves', () => {
        // Arrange
        const input = {
          isAdmin: false,
          isEditingSelf: true,
          hasRoleChange: true,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).toThrow(InsufficientPermissionsError);

        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).toThrow('Only admins can modify roles');
      });

      it('should throw when regular user tries to edit others with role change', () => {
        // Arrange
        const input = {
          isAdmin: false,
          isEditingSelf: false,
          hasRoleChange: true,
        };

        // Act & Assert
        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).toThrow(InsufficientPermissionsError);

        expect(() =>
          UserPermission.validateEditPermissions(input),
        ).toThrow('You do not have permission to edit other users');
      });
    });
  });

  describe('canUserEditOtherUsers', () => {
    it('should return true for admin users', () => {
      // Act
      const result = UserPermission.canUserEditOtherUsers(true);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for regular users', () => {
      // Act
      const result = UserPermission.canUserEditOtherUsers(false);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canUserEditRoles', () => {
    it('should return true for admin users', () => {
      // Act
      const result = UserPermission.canUserEditRoles(true);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for regular users', () => {
      // Act
      const result = UserPermission.canUserEditRoles(false);

      // Assert
      expect(result).toBe(false);
    });
  });
});
