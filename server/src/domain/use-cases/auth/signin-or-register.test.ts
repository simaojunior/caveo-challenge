import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { setupSigninOrRegister } from './signin-or-register';
import { User, UserRole } from '@/domain/entities/user';

vi.mock('@/infra/shared/logging/logger', () => ({
  createModuleLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('SigninOrRegister UseCase', () => {
  const mockUserRepo = {
    findUserByEmail: vi.fn(),
    createUser: vi.fn(),
  };

  const mockAuthGateway = {
    registerUser: vi.fn(),
    addUserToRole: vi.fn(),
    authenticateUser: vi.fn(),
    removeUser: vi.fn(),
    removeUserFromRole: vi.fn(),
  };

  const mockSaga = {
    addCompensation: vi.fn(),
    run: vi.fn(),
  };

  const setupSut = () => setupSigninOrRegister(
    mockUserRepo,
    mockAuthGateway,
    mockSaga,
  );

  beforeEach(() => {
    vi.clearAllMocks();

    const compensations: Array<() => Promise<void>> = [];

    mockSaga.addCompensation.mockImplementation((fn) => {
      compensations.unshift(fn); // LIFO order
    });

    mockSaga.run.mockImplementation(async (fn) => {
      try {
        return await fn();
      } catch (error) {
        for (const compensation of compensations) {
          try {
            await compensation();
          } catch {
            // Continue with other compensations even if one fails
          }
        }
        throw error;
      }
    });
  });

  describe('successful registration flow', () => {
    it('should complete registration without triggering compensations', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const externalId = faker.string.uuid();
      const tokens = {
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };

      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthGateway.registerUser.mockResolvedValue({ externalId });
      mockAuthGateway.addUserToRole.mockResolvedValue(undefined);
      mockAuthGateway.authenticateUser.mockResolvedValue(tokens);
      mockUserRepo.createUser.mockResolvedValue(undefined);

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result).toEqual({
        isOnboarded: false,
        isNewUser: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      expect(mockAuthGateway.removeUser).not.toHaveBeenCalled();
      expect(mockAuthGateway.removeUserFromRole).not.toHaveBeenCalled();
    });
  });

  describe('database failure with rollback', () => {
    it('should execute rollback when database save fails', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const externalId = faker.string.uuid();
      const tokens = {
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };

      const dbError = new Error('Database connection failed');

      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthGateway.registerUser.mockResolvedValue({ externalId });
      mockAuthGateway.addUserToRole.mockResolvedValue(undefined);
      mockAuthGateway.authenticateUser.mockResolvedValue(tokens);
      mockUserRepo.createUser.mockRejectedValue(dbError);
      mockAuthGateway.removeUser.mockResolvedValue(undefined);
      mockAuthGateway.removeUserFromRole.mockResolvedValue(undefined);

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(dbError);

      expect(mockAuthGateway.removeUser).toHaveBeenCalledWith({
        userId: externalId,
      });
    });

    it('should preserve original error even if compensations fail', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const originalError = new Error('Original database error');
      const compensationError = new Error('Compensation failed');

      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthGateway.registerUser.mockResolvedValue({
        externalId: faker.string.uuid(),
      });
      mockAuthGateway.addUserToRole.mockResolvedValue(undefined);
      mockAuthGateway.authenticateUser.mockResolvedValue({
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      });
      mockUserRepo.createUser.mockRejectedValue(originalError);
      mockAuthGateway.removeUser.mockRejectedValue(compensationError);
      mockAuthGateway.removeUserFromRole.mockRejectedValue(compensationError);

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(originalError);
      expect(mockAuthGateway.removeUser).toHaveBeenCalled();
    });
  });  describe('existing user signin', () => {
    it('should authenticate existing user without creating saga', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      const existingUser = User.create({
        email: input.email,
        name: faker.person.fullName(),
      });
      existingUser.markAsOnboarded();

      const tokens = {
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };

      mockUserRepo.findUserByEmail.mockResolvedValue(existingUser);
      mockAuthGateway.authenticateUser.mockResolvedValue(tokens);

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(result).toEqual({
        isOnboarded: true,
        isNewUser: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      // Verify no registration calls were made
      expect(mockAuthGateway.registerUser).not.toHaveBeenCalled();
      expect(mockAuthGateway.addUserToRole).not.toHaveBeenCalled();
      expect(mockUserRepo.createUser).not.toHaveBeenCalled();
    });
  });

  describe('authentication failure scenarios', () => {
    it('should not rollback if authentication fails after successful registration', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const externalId = faker.string.uuid();
      const authError = new Error('Authentication failed');

      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthGateway.registerUser.mockResolvedValue({ externalId });
      mockAuthGateway.addUserToRole.mockResolvedValue(undefined);
      mockUserRepo.createUser.mockResolvedValue(undefined);
      mockAuthGateway.authenticateUser.mockRejectedValue(authError);

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(authError);

      expect(mockAuthGateway.removeUser).not.toHaveBeenCalled();

      expect(mockAuthGateway.registerUser).toHaveBeenCalled();
      expect(mockAuthGateway.addUserToRole).toHaveBeenCalled();
      expect(mockUserRepo.createUser).toHaveBeenCalled();
    });

    it('should allow user retry authentication after registration success', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const externalId = faker.string.uuid();
      const authError = new Error('Authentication service temporarily unavailable');
      const tokens = {
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };

      mockUserRepo.findUserByEmail.mockResolvedValueOnce(null);
      mockAuthGateway.registerUser.mockResolvedValue({ externalId });
      mockAuthGateway.addUserToRole.mockResolvedValue(undefined);
      mockUserRepo.createUser.mockResolvedValue(undefined);
      mockAuthGateway.authenticateUser.mockRejectedValueOnce(authError);

      const sut = setupSut();

      // Act
      await expect(sut(input)).rejects.toThrow(authError);

      // Arrange
      const existingUser = User.create({
        email: input.email,
        name: input.name,
        role: input.role,
      });

      mockUserRepo.findUserByEmail.mockResolvedValueOnce(existingUser);
      mockAuthGateway.authenticateUser.mockResolvedValueOnce(tokens);

      // Act
      const result = await sut(input);

      // Assert
      expect(result).toEqual({
        isOnboarded: false,
        isNewUser: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      expect(mockAuthGateway.registerUser).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.createUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('saga operation ordering and boundaries', () => {
    it('should execute registration operations in saga and authentication outside', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const externalId = faker.string.uuid();
      const tokens = {
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };

      const operationOrder: string[] = [];

      mockUserRepo.findUserByEmail.mockResolvedValue(null);

      mockAuthGateway.registerUser.mockImplementation(async () => {
        operationOrder.push('registerUser');

        return { externalId };
      });

      mockAuthGateway.addUserToRole.mockImplementation(async () => {
        operationOrder.push('addUserToRole');
      });

      mockUserRepo.createUser.mockImplementation(async () => {
        operationOrder.push('createUser');
      });

      mockAuthGateway.authenticateUser.mockImplementation(async () => {
        operationOrder.push('authenticateUser');

        return tokens;
      });

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(operationOrder).toEqual([
        'registerUser',
        'addUserToRole',
        'createUser',
        'authenticateUser',
      ]);
    });

    it('should return user object from saga for authentication', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.ADMIN,
      };

      const externalId = faker.string.uuid();
      const tokens = {
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };

      let userReturnedFromSaga: User | undefined;

      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthGateway.registerUser.mockResolvedValue({ externalId });
      mockAuthGateway.addUserToRole.mockResolvedValue(undefined);
      mockUserRepo.createUser.mockResolvedValue(undefined);
      mockAuthGateway.authenticateUser.mockResolvedValue(tokens);

      mockSaga.run.mockImplementation(async (fn) => {
        userReturnedFromSaga = await fn();

        return userReturnedFromSaga;
      });

      const sut = setupSut();

      // Act
      const result = await sut(input);

      // Assert
      expect(userReturnedFromSaga).toBeDefined();
      expect(userReturnedFromSaga!.email).toBe(input.email);
      expect(userReturnedFromSaga!.name).toBe(input.name);
      expect(userReturnedFromSaga!.role).toBe(input.role);
      expect(userReturnedFromSaga!.externalId).toBe(externalId);

      expect(result.isOnboarded).toBe(userReturnedFromSaga!.isOnboarded);
    });

    it('should only add compensation after registerUser', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.USER,
      };

      const externalId = faker.string.uuid();
      const tokens = {
        accessToken: faker.string.uuid(),
        refreshToken: faker.string.uuid(),
      };

      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthGateway.registerUser.mockResolvedValue({ externalId });
      mockAuthGateway.addUserToRole.mockResolvedValue(undefined);
      mockUserRepo.createUser.mockResolvedValue(undefined);
      mockAuthGateway.authenticateUser.mockResolvedValue(tokens);

      const sut = setupSut();

      // Act
      await sut(input);

      // Assert
      expect(mockSaga.addCompensation).toHaveBeenCalledTimes(1);
      expect(mockSaga.addCompensation).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle role assignment failure with proper rollback', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        role: UserRole.ADMIN,
      };

      const externalId = faker.string.uuid();
      const roleError = new Error('Role assignment failed');

      mockUserRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthGateway.registerUser.mockResolvedValue({ externalId });
      mockAuthGateway.addUserToRole.mockRejectedValue(roleError);
      mockAuthGateway.removeUser.mockResolvedValue(undefined);

      const sut = setupSut();

      // Act & Assert
      await expect(sut(input)).rejects.toThrow(roleError);

      expect(mockAuthGateway.removeUser).toHaveBeenCalledWith({
        userId: externalId,
      });

      expect(mockUserRepo.createUser).not.toHaveBeenCalled();
      expect(mockAuthGateway.authenticateUser).not.toHaveBeenCalled();
    });
  });
});
