import type { UserRole } from '@/domain/entities/user';
import { ResourceNotFound } from '@/application/errors';
import { UserUpdateBuilder } from '@/domain/builders/user-update';
import { UserPermission } from '@/domain/services/user-permission';
import type { IFindUser, IUpdateUser } from '@/domain/contracts/repos/user';

type Input = {
  userId?: string;
  currentUserRoles?: UserRole[];
  currentUserId?: string;
  name?: string;
  role?: UserRole;
}

type Output = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isOnboarded: boolean;
}

export type EditAccountUseCase = (input: Input) => Promise<Output>;

type Setup = (userRepo: IFindUser & IUpdateUser) => EditAccountUseCase;

export const setupEditAccount: Setup = (userRepo) => {
  return async ({ userId, currentUserRoles, currentUserId, name, role }) => {
    const isAdmin = currentUserRoles?.includes('admin') ?? false;
    const userIdToEdit = userId || currentUserId;
    const isEditingSelf = userIdToEdit === currentUserId;

    UserPermission.validateEditPermissions({
      isAdmin,
      isEditingSelf,
      hasRoleChange: Boolean(role),
    });

    if (!userIdToEdit) {
      throw new ResourceNotFound('User ID is required');
    }

    const userData = await userRepo.findUser({
      id: userIdToEdit,
    });

    if (!userData) {
      throw new ResourceNotFound(`User with ID ${userIdToEdit} not found`);
    }

    const { user, shouldMarkOnboarded } = new UserUpdateBuilder(userData)
      .withName(name)
      .withRole(role, isAdmin)
      .build();

    if (shouldMarkOnboarded) {
      user.markAsOnboarded();
    }

    await userRepo.updateUser(user.toJSON());

    return {
      id: user.id,
      name: user.name ?? userData.name ?? '',
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
    };
  };
};
