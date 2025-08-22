import { faker } from '@faker-js/faker';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setupEditAccount } from './edit-account';
import { ResourceNotFound } from '@/application/errors';
import { InsufficientPermissionsError } from '@/domain/errors';
import { UserUpdateBuilder } from '@/domain/builders/user-update';
import { UserRole, type UserProps } from '@/domain/entities/user';
import { UserPermission } from '@/domain/services/user-permission';

vi.mock('@/domain/services/user-permission');
vi.mock('@/domain/builders/user-update');

describe('EditAccount UseCase', () => {
  const mockUserRepo = {
    findUser: vi.fn(),
    updateUser: vi.fn(),
  };

  const mockUserPermission = vi.mocked(UserPermission);
  const MockUserUpdateBuilder = vi.mocked(UserUpdateBuilder);

  const setupSut = () => setupEditAccount(mockUserRepo);

  let baseUserData: UserProps;
  let mockUser: {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
    isOnboarded: boolean;
    markAsOnboarded: ReturnType<typeof vi.fn>;
    toJSON: ReturnType<typeof vi.fn>;
  };
  let mockBuilder: {
    withName: ReturnType<typeof vi.fn>;
    withRole: ReturnType<typeof vi.fn>;
    build: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    baseUserData = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: UserRole.USER,
      isOnboarded: false,
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
      deletedAt: null,
    };

    mockUser = {
      id: baseUserData.id,
      name: baseUserData.name,
      email: baseUserData.email,
      role: baseUserData.role,
      isOnboarded: baseUserData.isOnboarded,
      markAsOnboarded: vi.fn(),
      toJSON: vi.fn().mockReturnValue(baseUserData),
    };

    mockBuilder = {
      withName: vi.fn().mockReturnThis(),
      withRole: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({
        user: mockUser,
        shouldMarkOnboarded: false,
      }),
    };

    MockUserUpdateBuilder.mockImplementation(
      () => mockBuilder as unknown as UserUpdateBuilder,
    );
    mockUserRepo.findUser.mockResolvedValue(baseUserData);
    mockUserRepo.updateUser.mockResolvedValue(undefined);
    mockUserPermission.validateEditPermissions.mockImplementation(() => {});
  });

  describe('successful user self-edit scenarios', () => {
    it('should allow regular user to edit their own name', async () => {
      // Arrange
      const newName = faker.person.fullName();
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        name: newName,
      };

      mockBuilder.build.mockReturnValue({
        user: { ...mockUser, name: newName, isOnboarded: true },
        shouldMarkOnboarded: true,
      });

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(mockUserPermission.validateEditPermissions).toHaveBeenCalledWith({
        isAdmin: false,
        isEditingSelf: true,
        hasRoleChange: false,
      });

      expect(MockUserUpdateBuilder).toHaveBeenCalledWith(baseUserData);
      expect(mockBuilder.withName).toHaveBeenCalledWith(newName);
      expect(mockBuilder.withRole).toHaveBeenCalledWith(undefined, false);

      expect(result).toEqual({
        id: baseUserData.id,
        name: newName,
        email: baseUserData.email,
        role: UserRole.USER,
        isOnboarded: true,
      });
    });

    it('should mark user as onboarded when name is updated', async () => {
      // Arrange
      const newName = faker.person.fullName();
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        name: newName,
      };

      mockBuilder.build.mockReturnValue({
        user: mockUser,
        shouldMarkOnboarded: true,
      });

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUser.markAsOnboarded).toHaveBeenCalled();
    });

    it('should not mark as onboarded when name is not updated', async () => {
      // Arrange
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.ADMIN],
        role: UserRole.ADMIN,
      };

      mockBuilder.build.mockReturnValue({
        user: mockUser,
        shouldMarkOnboarded: false,
      });

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUser.markAsOnboarded).not.toHaveBeenCalled();
    });
  });

  describe('admin user scenarios', () => {
    it('should allow admin to edit other users name and role', async () => {
      // Arrange
      const otherUserId = faker.string.uuid();
      const newName = faker.person.fullName();
      const input = {
        userId: otherUserId,
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.ADMIN],
        name: newName,
        role: UserRole.ADMIN,
      };

      const otherUserData = { ...baseUserData, id: otherUserId };
      mockUserRepo.findUser.mockResolvedValue(otherUserData);

      const updatedUser = {
        ...mockUser,
        id: otherUserId,
        name: newName,
        role: UserRole.ADMIN,
        isOnboarded: true,
      };

      mockBuilder.build.mockReturnValue({
        user: updatedUser,
        shouldMarkOnboarded: true,
      });

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(mockUserPermission.validateEditPermissions).toHaveBeenCalledWith({
        isAdmin: true,
        isEditingSelf: false,
        hasRoleChange: true,
      });

      expect(mockBuilder.withName).toHaveBeenCalledWith(newName);
      expect(mockBuilder.withRole).toHaveBeenCalledWith(UserRole.ADMIN, true);

      expect(result).toEqual({
        id: otherUserId,
        name: newName,
        email: otherUserData.email,
        role: UserRole.ADMIN,
        isOnboarded: true,
      });
    });

    it('should allow admin to edit only role without name', async () => {
      // Arrange
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.ADMIN],
        role: UserRole.ADMIN,
      };

      const updatedUser = { ...mockUser, role: UserRole.ADMIN };
      mockBuilder.build.mockReturnValue({
        user: updatedUser,
        shouldMarkOnboarded: false,
      });

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(mockBuilder.withName).toHaveBeenCalledWith(undefined);
      expect(mockBuilder.withRole).toHaveBeenCalledWith(UserRole.ADMIN, true);
      expect(result.role).toBe(UserRole.ADMIN);
      expect(mockUser.markAsOnboarded).not.toHaveBeenCalled();
    });
  });

  describe('permission validation', () => {
    it('should delegate permission validation to UserPermission service', async () => {
      // Arrange
      const input = {
        userId: faker.string.uuid(),
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserPermission.validateEditPermissions).toHaveBeenCalledWith({
        isAdmin: false,
        isEditingSelf: false,
        hasRoleChange: false,
      });
    });

    it('should throw when permission validation fails', async () => {
      // Arrange
      const permissionError = new InsufficientPermissionsError('Access denied');
      mockUserPermission.validateEditPermissions.mockImplementation(() => {
        throw permissionError;
      });

      const input = {
        userId: faker.string.uuid(),
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(InsufficientPermissionsError);
      expect(mockUserRepo.findUser).not.toHaveBeenCalled();
    });
  });

  describe('user ID resolution', () => {
    it('should use provided userId when given', async () => {
      // Arrange
      const targetUserId = faker.string.uuid();
      const input = {
        userId: targetUserId,
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.ADMIN],
        name: faker.person.fullName(),
      };

      const targetUserData = { ...baseUserData, id: targetUserId };
      mockUserRepo.findUser.mockResolvedValue(targetUserData);

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.findUser).toHaveBeenCalledWith({
        id: targetUserId,
      });
    });

    it('should use currentUserId when userId is not provided', async () => {
      // Arrange
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.findUser).toHaveBeenCalledWith({
        id: baseUserData.id,
      });
    });

    it('should throw ResourceNotFound when no user ID is available', async () => {
      // Arrange
      const input = {
        currentUserRoles: [UserRole.USER],
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(ResourceNotFound);
      await expect(sut(input)).rejects.toThrow('User ID is required');
    });
  });

  describe('user data validation', () => {
    it('should throw ResourceNotFound when user does not exist', async () => {
      // Arrange
      const nonExistentUserId = faker.string.uuid();
      mockUserRepo.findUser.mockResolvedValue(null);

      const input = {
        currentUserId: nonExistentUserId,
        currentUserRoles: [UserRole.USER],
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(ResourceNotFound);
      await expect(sut(input)).rejects.toThrow(
        `User with ID ${nonExistentUserId} not found`,
      );
    });
  });

  describe('builder integration', () => {
    it('should pass correct parameters to UserUpdateBuilder', async () => {
      // Arrange
      const newName = faker.person.fullName();
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.ADMIN],
        name: newName,
        role: UserRole.ADMIN,
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(MockUserUpdateBuilder).toHaveBeenCalledWith(baseUserData);
      expect(mockBuilder.withName).toHaveBeenCalledWith(newName);
      expect(mockBuilder.withRole).toHaveBeenCalledWith(UserRole.ADMIN, true);
    });

    it('should pass admin permission correctly to builder', async () => {
      // Arrange
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        role: UserRole.ADMIN,
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockBuilder.withRole).toHaveBeenCalledWith(UserRole.ADMIN, false);
    });
  });

  describe('role handling', () => {
    it('should handle undefined currentUserRoles gracefully', async () => {
      // Arrange
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: undefined,
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserPermission.validateEditPermissions).toHaveBeenCalledWith({
        isAdmin: false,
        isEditingSelf: true,
        hasRoleChange: false,
      });
    });

    it('should handle empty currentUserRoles array', async () => {
      // Arrange
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [],
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserPermission.validateEditPermissions).toHaveBeenCalledWith({
        isAdmin: false,
        isEditingSelf: true,
        hasRoleChange: false,
      });
    });
  });

  describe('repository integration', () => {
    it('should call updateUser with user JSON representation', async () => {
      // Arrange
      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        name: faker.person.fullName(),
      };

      const expectedUserJson = { ...baseUserData, updated: true };
      mockUser.toJSON.mockReturnValue(expectedUserJson);

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(expectedUserJson);
    });

    it('should handle repository update failure', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockUserRepo.updateUser.mockRejectedValue(repositoryError);

      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        name: faker.person.fullName(),
      };

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow('Database connection failed');
    });
  });

  describe('return value formatting', () => {
    it('should fallback to userData name when user name is undefined', async () => {
      // Arrange
      const expectedUser = {
        ...mockUser,
        name: undefined,
      };

      mockBuilder.build.mockReturnValue({
        user: expectedUser,
        shouldMarkOnboarded: false,
      });

      const input = {
        currentUserId: baseUserData.id,
        currentUserRoles: [UserRole.USER],
        role: UserRole.USER,
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result.name).toBe(baseUserData.name);
    });
  });
});
