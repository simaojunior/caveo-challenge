import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetMeController } from './get-me';
import { UserRole } from '@/domain/entities/user';
import type { GetMeUseCase } from '@/domain/use-cases';
import type { HttpRequest } from '@/application/contracts';
import { ResourceNotFound } from '@/application/errors';

describe('GetMeController', () => {
  let sut: GetMeController;
  let mockUseCase: GetMeUseCase;

  beforeEach(() => {
    mockUseCase = vi.fn();
    sut = new GetMeController(mockUseCase);
  });

  describe('successful user retrieval', () => {
    it('should return 200 with user data when user exists', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const userRoles = [UserRole.USER];

      const useCaseResponse = {
        id: userId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: UserRole.USER,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        user: {
          id: userId,
          roles: userRoles,
        },
        headers: {},
        body: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        id: userId,
        roles: userRoles,
      });

      expect(response).toEqual({
        statusCode: 200,
        data: {
          id: useCaseResponse.id,
          name: useCaseResponse.name,
          email: useCaseResponse.email,
          role: useCaseResponse.role,
          isOnboarded: useCaseResponse.isOnboarded,
        },
      });
    });

    it('should handle admin user', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const userRoles = [UserRole.ADMIN];

      const useCaseResponse = {
        id: userId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: UserRole.ADMIN,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        user: {
          id: userId,
          roles: userRoles,
        },
        headers: {},
        body: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        id: userId,
        roles: userRoles,
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({
        id: useCaseResponse.id,
        name: useCaseResponse.name,
        email: useCaseResponse.email,
        role: useCaseResponse.role,
        isOnboarded: useCaseResponse.isOnboarded,
      });
    });

    it('should handle user with multiple roles', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const userRoles = [UserRole.USER, UserRole.ADMIN];

      const useCaseResponse = {
        id: userId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: UserRole.ADMIN,
        isOnboarded: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        user: {
          id: userId,
          roles: userRoles,
        },
        headers: {},
        body: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        id: userId,
        roles: userRoles,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('input validation', () => {
    it('should throw validation error when user ID is missing', async () => {
      // Arrange
      const request: HttpRequest = {
        user: {
          id: undefined as unknown as string,
          roles: [UserRole.USER],
        },
        headers: {},
        body: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error when user ID is empty', async () => {
      // Arrange
      const request: HttpRequest = {
        user: {
          id: '',
          roles: [UserRole.USER],
        },
        headers: {},
        body: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error when roles are missing', async () => {
      // Arrange
      const request: HttpRequest = {
        user: {
          id: faker.string.uuid(),
          roles: undefined as unknown as UserRole[],
        },
        headers: {},
        body: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error when roles contain invalid values', async () => {
      // Arrange
      const request: HttpRequest = {
        user: {
          id: faker.string.uuid(),
          roles: ['invalid-role'] as unknown as UserRole[],
        },
        headers: {},
        body: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should accept empty roles array', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const userRoles: UserRole[] = [];

      const useCaseResponse = {
        id: userId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: UserRole.USER,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        user: {
          id: userId,
          roles: userRoles,
        },
        headers: {},
        body: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        id: userId,
        roles: userRoles,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('error handling', () => {
    it('should propagate use case errors', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const request: HttpRequest = {
        user: {
          id: userId,
          roles: [UserRole.USER],
        },
        headers: {},
        body: {},
      };

      const useCaseError = new ResourceNotFound('User not found');
      vi.mocked(mockUseCase).mockRejectedValue(useCaseError);

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow('User not found');
    });

    it('should handle missing user context', async () => {
      // Arrange
      const request: HttpRequest = {
        headers: {},
        body: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should handle malformed user context', async () => {
      // Arrange
      const request: HttpRequest = {
        user: undefined,
        headers: {},
        body: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });
  });

  describe('use case integration', () => {
    it('should call use case exactly once with correct parameters', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const userRoles = [UserRole.USER];

      const useCaseResponse = {
        id: userId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: UserRole.USER,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        user: {
          id: userId,
          roles: userRoles,
        },
        headers: {},
        body: {},
      };

      // Act
      await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledTimes(1);
      expect(mockUseCase).toHaveBeenCalledWith({
        id: userId,
        roles: userRoles,
      });
    });

    it('should return exact response from use case', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const specificResponse = {
        id: userId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: UserRole.ADMIN,
        isOnboarded: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(specificResponse);

      const request: HttpRequest = {
        user: {
          id: userId,
          roles: [UserRole.ADMIN],
        },
        headers: {},
        body: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(response).toEqual({
        statusCode: 200,
        data: specificResponse,
      });
    });
  });
});
