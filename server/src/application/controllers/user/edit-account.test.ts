import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditAccountController } from './edit-account';
import { UserRole } from '@/domain/entities/user';
import type { EditAccountUseCase } from '@/domain/use-cases';
import type { HttpRequest } from '@/application/contracts';
import { ResourceNotFound } from '@/application/errors';
import { InsufficientPermissionsError } from '@/domain/errors';

describe('EditAccountController', () => {
  let sut: EditAccountController;
  let mockUseCase: EditAccountUseCase;

  beforeEach(() => {
    mockUseCase = vi.fn();
    sut = new EditAccountController(mockUseCase);
  });

  describe('successful account updates', () => {
    it('should return 200 when updating user name', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const newName = faker.person.fullName();

      const requestBody = {
        userId,
        name: newName,
      };

      const useCaseResponse = {
        id: userId,
        name: newName,
        email: faker.internet.email(),
        role: UserRole.USER,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        userId,
        currentUserId: request.user?.id,
        currentUserRoles: request.user?.roles,
        name: newName,
        role: undefined,
      });

      expect(response).toEqual({
        statusCode: 200,
        data: {
          id: userId,
          name: newName,
          email: useCaseResponse.email,
          isOnboarded: true,
        },
      });
    });

    it('should return 200 when updating user role', async () => {
      // Arrange
      const userId = faker.string.uuid();

      const requestBody = {
        userId,
        role: UserRole.ADMIN,
      };

      const useCaseResponse = {
        id: userId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: UserRole.ADMIN,
        isOnboarded: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        userId,
        currentUserId: request.user?.id,
        currentUserRoles: request.user?.roles,
        name: undefined,
        role: UserRole.ADMIN,
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toHaveProperty('id', userId);
      expect(response.data).toHaveProperty('isOnboarded', false);
    });

    it('should return 200 when updating both name and role', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const newName = faker.person.fullName();

      const requestBody = {
        userId,
        name: newName,
        role: UserRole.ADMIN,
      };

      const useCaseResponse = {
        id: userId,
        name: newName,
        email: faker.internet.email(),
        role: UserRole.ADMIN,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        userId,
        currentUserId: request.user?.id,
        currentUserRoles: request.user?.roles,
        name: newName,
        role: UserRole.ADMIN,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('input validation', () => {
    it('should throw validation error for invalid userId', async () => {
      // Arrange
      const requestBody = {
        userId: 'invalid-uuid',
        name: faker.person.fullName(),
      };

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error for empty name', async () => {
      // Arrange
      const requestBody = {
        userId: faker.string.uuid(),
        name: '',
      };

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid role', async () => {
      // Arrange
      const requestBody = {
        userId: faker.string.uuid(),
        role: 'invalid-role',
      };

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error when neither name nor role is provided', async () => {
      // Arrange
      const requestBody = {
        userId: faker.string.uuid(),
      };

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should accept undefined values for optional fields', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const requestBody = {
        userId,
        name: faker.person.fullName(),
        role: undefined,
      };

      const useCaseResponse = {
        id: userId,
        name: requestBody.name,
        email: faker.internet.email(),
        role: UserRole.USER,
        isOnboarded: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.USER],
        },
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        userId,
        currentUserId: request.user?.id,
        currentUserRoles: request.user?.roles,
        name: requestBody.name,
        role: undefined,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('error handling', () => {
    it('should propagate ResourceNotFound errors', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const requestBody = {
        userId,
        name: faker.person.fullName(),
      };

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      const useCaseError = new ResourceNotFound('User not found');
      vi.mocked(mockUseCase).mockRejectedValue(useCaseError);

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow('User not found');
    });

    it('should propagate InsufficientPermissionsError', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const requestBody = {
        userId,
        role: UserRole.ADMIN,
      };

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.USER],
        },
        headers: {},
      };

      const useCaseError = new InsufficientPermissionsError('Insufficient permissions');
      vi.mocked(mockUseCase).mockRejectedValue(useCaseError);

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow('Insufficient permissions');
    });

    it('should handle malformed request body', async () => {
      // Arrange
      const request: HttpRequest = {
        body: null,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should handle missing user context', async () => {
      // Arrange
      const requestBody = {
        userId: faker.string.uuid(),
        name: faker.person.fullName(),
      };

      const request: HttpRequest = {
        body: requestBody,
        user: undefined,
        headers: {},
      };

      // Act
      const useCaseResponse = {
        id: requestBody.userId,
        name: requestBody.name,
        email: faker.internet.email(),
        role: UserRole.USER,
        isOnboarded: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        userId: requestBody.userId,
        currentUserId: undefined,
        currentUserRoles: undefined,
        name: requestBody.name,
        role: undefined,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('use case integration', () => {
    it('should call use case exactly once with correct parameters', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const currentUserId = faker.string.uuid();
      const newName = faker.person.fullName();

      const requestBody = {
        userId,
        name: newName,
        role: UserRole.ADMIN,
      };

      const useCaseResponse = {
        id: userId,
        name: newName,
        email: faker.internet.email(),
        role: UserRole.ADMIN,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: currentUserId,
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act
      await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledTimes(1);
      expect(mockUseCase).toHaveBeenCalledWith({
        userId,
        currentUserId,
        currentUserRoles: [UserRole.ADMIN],
        name: newName,
        role: UserRole.ADMIN,
      });
    });

    it('should return correctly formatted response from use case', async () => {
      // Arrange
      const specificResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: UserRole.USER,
        isOnboarded: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(specificResponse);

      const requestBody = {
        userId: specificResponse.id,
        name: specificResponse.name,
      };

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: specificResponse.id,
          roles: [UserRole.USER],
        },
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(response).toEqual({
        statusCode: 200,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          email: 'john.doe@example.com',
          isOnboarded: false,
        },
      });
    });

    it('should not include role in response', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const requestBody = {
        userId,
        name: faker.person.fullName(),
      };

      const useCaseResponse = {
        id: userId,
        name: requestBody.name,
        email: faker.internet.email(),
        role: UserRole.ADMIN,
        isOnboarded: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        user: {
          id: faker.string.uuid(),
          roles: [UserRole.ADMIN],
        },
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(response.data).not.toHaveProperty('role');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('email');
      expect(response.data).toHaveProperty('isOnboarded');
    });
  });
});
