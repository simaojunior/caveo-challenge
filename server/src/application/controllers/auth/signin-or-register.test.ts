import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SigninOrRegisterController } from './signin-or-register';
import { UserRole } from '@/domain/entities/user';
import type { SigninOrRegisterUseCase } from '@/domain/use-cases';
import type { HttpRequest } from '@/application/contracts';

describe('SigninOrRegisterController', () => {
  let sut: SigninOrRegisterController;
  let mockUseCase: SigninOrRegisterUseCase;

  beforeEach(() => {
    mockUseCase = vi.fn();
    sut = new SigninOrRegisterController(mockUseCase);
  });

  describe('successful authentication', () => {
    it('should return 200 for existing user signin', async () => {
      // Arrange
      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
        name: faker.person.fullName(),
      };

      const useCaseResponse = {
        accessToken: faker.string.alphanumeric(100),
        refreshToken: faker.string.alphanumeric(100),
        isOnboarded: true,
        isNewUser: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        email: requestBody.email,
        password: requestBody.password,
        name: requestBody.name,
        role: undefined,
      });

      expect(response).toEqual({
        statusCode: 200,
        data: {
          accessToken: useCaseResponse.accessToken,
          refreshToken: useCaseResponse.refreshToken,
          isOnboarded: true,
        },
      });
    });

    it('should return 201 for new user registration', async () => {
      // Arrange
      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const useCaseResponse = {
        accessToken: faker.string.alphanumeric(100),
        refreshToken: faker.string.alphanumeric(100),
        isOnboarded: false,
        isNewUser: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith(requestBody);

      expect(response).toEqual({
        statusCode: 201,
        data: {
          accessToken: useCaseResponse.accessToken,
          refreshToken: useCaseResponse.refreshToken,
          isOnboarded: false,
        },
      });
    });

    it('should handle admin role registration', async () => {
      // Arrange
      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
        name: faker.person.fullName(),
        role: UserRole.ADMIN,
      };

      const useCaseResponse = {
        accessToken: faker.string.alphanumeric(100),
        refreshToken: faker.string.alphanumeric(100),
        isOnboarded: true,
        isNewUser: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith(requestBody);
      expect(response.statusCode).toBe(201);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('isOnboarded');
    });
  });

  describe('input validation', () => {
    it('should throw validation error for invalid email', async () => {
      // Arrange
      const requestBody = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error for weak password', async () => {
      // Arrange
      const testCases = [
        { password: 'weak', description: 'too short' },
        { password: 'password123', description: 'no uppercase' },
        { password: 'PASSWORD123', description: 'no lowercase' },
        { password: 'Password', description: 'no number' },
        { password: 'Password123', description: 'no special character' },
      ];

      for (const testCase of testCases) {
        const requestBody = {
          email: faker.internet.email(),
          password: testCase.password,
        };

        const request: HttpRequest = {
          body: requestBody,
          headers: {},
        };

        // Act & Assert
        await expect(sut.handle(request)).rejects.toThrow();
      }

      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid role', async () => {
      // Arrange
      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
        role: 'invalid-role',
      };

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should validate name length limits', async () => {
      // Arrange
      const longName = 'a'.repeat(101); // Exceeds 100 character limit

      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
        name: longName,
      };

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });

    it('should accept optional fields as undefined', async () => {
      // Arrange
      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
      };

      const useCaseResponse = {
        accessToken: faker.string.alphanumeric(100),
        refreshToken: faker.string.alphanumeric(100),
        isOnboarded: false,
        isNewUser: true,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act
      const response = await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledWith({
        email: requestBody.email,
        password: requestBody.password,
        name: undefined,
        role: undefined,
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('error handling', () => {
    it('should propagate use case errors', async () => {
      // Arrange
      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
      };

      const useCaseError = new Error('Authentication failed');
      vi.mocked(mockUseCase).mockRejectedValue(useCaseError);

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow('Authentication failed');
    });

    it('should handle malformed request body', async () => {
      // Arrange
      const request: HttpRequest = {
        body: null,
        headers: {},
      };

      // Act & Assert
      await expect(sut.handle(request)).rejects.toThrow();
      expect(mockUseCase).not.toHaveBeenCalled();
    });
  });

  describe('use case integration', () => {
    it('should pass all provided fields to use case', async () => {
      // Arrange
      const requestBody = {
        email: faker.internet.email(),
        password: 'Password123!',
        name: faker.person.fullName(),
        role: UserRole.ADMIN,
      };

      const useCaseResponse = {
        accessToken: faker.string.alphanumeric(100),
        refreshToken: faker.string.alphanumeric(100),
        isOnboarded: true,
        isNewUser: false,
      };

      vi.mocked(mockUseCase).mockResolvedValue(useCaseResponse);

      const request: HttpRequest = {
        body: requestBody,
        headers: {},
      };

      // Act
      await sut.handle(request);

      // Assert
      expect(mockUseCase).toHaveBeenCalledTimes(1);
      expect(mockUseCase).toHaveBeenCalledWith({
        email: requestBody.email,
        password: requestBody.password,
        name: requestBody.name,
        role: requestBody.role,
      });
    });
  });
});
