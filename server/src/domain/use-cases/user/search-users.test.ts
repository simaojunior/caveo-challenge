import { faker } from '@faker-js/faker';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setupSearchUsers } from './search-users';
import { User, UserRole } from '@/domain/entities';
import type { ISearchUsers, SearchUsers } from '@/domain/contracts/repos/user';

describe('SearchUsers UseCase', () => {
  const mockUserRepo = {
    searchUsers: vi.fn(),
  } satisfies ISearchUsers;

  const setupSut = () => setupSearchUsers(mockUserRepo);

  let mockSearchResult: SearchUsers.Result;
  let baseUserData: SearchUsers.Output;

  beforeEach(() => {
    vi.clearAllMocks();

    baseUserData = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: UserRole.USER,
      isOnboarded: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      deletedAt: null,
    };

    mockSearchResult = {
      users: [baseUserData],
      meta: {
        total: 1,
        itemsPerPage: 10,
        totalPages: 1,
        page: 1,
      },
    };

    mockUserRepo.searchUsers.mockResolvedValue(mockSearchResult);
  });

  describe('successful user search', () => {
    it('should return users with correct structure', async () => {
      // Arrange
      const input = {
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        pagination: input.pagination,
      });

      expect(result).toEqual({
        users: [
          {
            id: baseUserData.id,
            name: baseUserData.name,
            email: baseUserData.email,
            role: baseUserData.role,
            isOnboarded: baseUserData.isOnboarded,
          },
        ],
        meta: mockSearchResult.meta,
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      const emptyResult = {
        users: [],
        meta: {
          total: 0,
          itemsPerPage: 10,
          totalPages: 0,
          page: 1,
        },
      };

      mockUserRepo.searchUsers.mockResolvedValue(emptyResult);

      const input = {
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result).toEqual({
        users: [],
        meta: emptyResult.meta,
      });
    });

    it('should handle user with null name', async () => {
      // Arrange
      const userWithoutName = {
        ...baseUserData,
        name: undefined,
      };

      mockUserRepo.searchUsers.mockResolvedValue({
        users: [userWithoutName],
        meta: mockSearchResult.meta,
      });

      const input = {
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result.users).toHaveLength(1);
      expect(result.users[0]?.name).toBe('');
    });

    it('should handle multiple users', async () => {
      // Arrange
      const user2 = {
        ...baseUserData,
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: UserRole.ADMIN,
      };

      const multipleUsersResult = {
        users: [baseUserData, user2],
        meta: {
          total: 2,
          itemsPerPage: 10,
          totalPages: 1,
          page: 1,
        },
      };

      mockUserRepo.searchUsers.mockResolvedValue(multipleUsersResult);

      const input = {
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({
        id: baseUserData.id,
        name: baseUserData.name,
        email: baseUserData.email,
        role: baseUserData.role,
        isOnboarded: baseUserData.isOnboarded,
      });
      expect(result.users[1]).toEqual({
        id: user2.id,
        name: user2.name,
        email: user2.email,
        role: user2.role,
        isOnboarded: user2.isOnboarded,
      });
    });
  });

  describe('search filters', () => {
    it('should pass name filter to repository', async () => {
      // Arrange
      const input = {
        name: 'John',
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        name: 'John',
        pagination: input.pagination,
      });
    });

    it('should pass email filter to repository', async () => {
      // Arrange
      const input = {
        email: 'john@example.com',
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        email: 'john@example.com',
        pagination: input.pagination,
      });
    });

    it('should pass role filter to repository', async () => {
      // Arrange
      const input = {
        role: UserRole.ADMIN,
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        role: UserRole.ADMIN,
        pagination: input.pagination,
      });
    });

    it('should pass isOnboarded filter to repository', async () => {
      // Arrange
      const input = {
        isOnboarded: true,
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        isOnboarded: true,
        pagination: input.pagination,
      });
    });

    it('should pass id filter to repository', async () => {
      // Arrange
      const input = {
        id: faker.string.uuid(),
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        id: input.id,
        pagination: input.pagination,
      });
    });

    it('should pass multiple filters to repository', async () => {
      // Arrange
      const input = {
        name: 'John',
        email: 'john@example.com',
        role: UserRole.ADMIN,
        isOnboarded: false,
        pagination: {
          itemsPerPage: 20,
          page: 2,
        },
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
        role: UserRole.ADMIN,
        isOnboarded: false,
        pagination: {
          itemsPerPage: 20,
          page: 2,
        },
      });
    });
  });

  describe('pagination', () => {
    it('should handle different pagination settings', async () => {
      // Arrange
      const paginationInput = {
        itemsPerPage: 5,
        page: 3,
      };

      const paginatedResult = {
        users: [baseUserData],
        meta: {
          total: 15,
          itemsPerPage: 5,
          totalPages: 3,
          page: 3,
        },
      };

      mockUserRepo.searchUsers.mockResolvedValue(paginatedResult);

      const input = {
        pagination: paginationInput,
      };

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(mockUserRepo.searchUsers).toHaveBeenCalledWith({
        pagination: paginationInput,
      });

      expect(result.meta).toEqual(paginatedResult.meta);
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserRepo.searchUsers.mockRejectedValue(error);

      const input = {
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow('Database connection failed');
    });
  });

  describe('user entity creation', () => {
    it('should create user entities correctly', async () => {
      // Arrange
      const userCreateSpy = vi.spyOn(User, 'create');

      const input = {
        pagination: {
          itemsPerPage: 10,
          page: 1,
        },
      };

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(userCreateSpy).toHaveBeenCalledWith({
        ...baseUserData,
        email: baseUserData.email,
      });
    });
  });
});
