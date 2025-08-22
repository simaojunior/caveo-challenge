import { InsufficientPermissionsError } from '@/domain/errors';

export class UserPermission {
  static validateEditPermissions(input: {
    isAdmin: boolean;
    isEditingSelf: boolean;
    hasRoleChange: boolean;
  }): void {
    const { isAdmin, isEditingSelf, hasRoleChange } = input;

    const canEditOthers = isAdmin;
    const canEditRole = isAdmin;

    if (!isEditingSelf && !canEditOthers) {
      throw new InsufficientPermissionsError(
        'You do not have permission to edit other users',
      );
    }

    if (hasRoleChange && !canEditRole) {
      throw new InsufficientPermissionsError(
        'Only admins can modify roles',
      );
    }
  }

  static canUserEditOtherUsers(isAdmin: boolean): boolean {
    return isAdmin;
  }

  static canUserEditRoles(isAdmin: boolean): boolean {
    return isAdmin;
  }
}
