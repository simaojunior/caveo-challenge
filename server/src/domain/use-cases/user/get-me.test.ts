import { faker } from '@faker-js/faker';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setupGetMe } from './get-me';
import { ResourceNotFound } from '@/application/errors';
import { UserRole, type UserProps } from '@/domain/entities/user';

describe('GetMe UseCase', () => {
  const mockUserRepo = {
    findUser: vi.fn(),
  };

  const setupSut = () => setupGetMe(mockUserRepo);

  let baseUserData: UserProps;

  beforeEach(() => {
    vi.clearAllMocks();

    baseUserData = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: UserRole.USER,
      isOnboarded: false,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

    mockUserRepo.findUser.mockResolvedValue(baseUserData);
  });

  describe('successful user retrieval', () => {
    it('should return user data when user exists', async () => {
      // Arrange
      const input = {
        id: baseUserData.id,
        roles: [UserRole.USER],
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(mockUserRepo.findUser).toHaveBeenCalledWith({
        id: baseUserData.id,
      });

      expect(result).toEqual({
        id: baseUserData.id,
        name: baseUserData.name,
        email: baseUserData.email,
        role: baseUserData.role,
        isOnboarded: baseUserData.isOnboarded,
      });
    });

    it('should return user data when name is undefined', async () => {
      // Arrange
      const userDataWithoutName = {
        ...baseUserData,
        name: undefined,
      };

      mockUserRepo.findUser.mockResolvedValue(userDataWithoutName);

      const input = {
        id: userDataWithoutName.id,
        roles: [UserRole.USER],
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result).toEqual({
        id: userDataWithoutName.id,
        name: undefined,
        email: userDataWithoutName.email,
        role: userDataWithoutName.role,
        isOnboarded: userDataWithoutName.isOnboarded,
      });
    });
  });

  describe('error handling', () => {
    it('should throw ResourceNotFound when user does not exist', async () => {
      // Arrange
      const nonExistentUserId = faker.string.uuid();
      mockUserRepo.findUser.mockResolvedValue(null);

      const input = {
        id: nonExistentUserId,
        roles: [UserRole.USER],
      };

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(ResourceNotFound);
      await expect(sut(input)).rejects.toThrow(`User with ID ${nonExistentUserId} not found`);

      expect(mockUserRepo.findUser).toHaveBeenCalledWith({
        id: nonExistentUserId,
      });
    });

    it('should handle repository failure', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockUserRepo.findUser.mockRejectedValue(repositoryError);

      const input = {
        id: baseUserData.id,
        roles: [UserRole.USER],
      };

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow('Database connection failed');
    });
  });

  describe('repository integration', () => {
    it('should call findUser with correct parameters', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const input = {
        id: userId,
        roles: [UserRole.USER],
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.findUser).toHaveBeenCalledOnce();
      expect(mockUserRepo.findUser).toHaveBeenCalledWith({
        id: userId,
      });
    });
  });

  describe('return value formatting', () => {
    it('should return correctly formatted output with all required fields', async () => {
      // Arrange
      const input = {
        id: baseUserData.id,
        roles: [UserRole.USER],
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('isOnboarded');

      expect(typeof result.id).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(typeof result.role).toBe('string');
      expect(typeof result.isOnboarded).toBe('boolean');
      expect(result.name === undefined || typeof result.name === 'string').toBe(true);
    });
  });
});
