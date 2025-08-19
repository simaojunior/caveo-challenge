import { createHmac } from 'node:crypto';
import { faker } from '@faker-js/faker';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Config } from '@/main/config/app-config';
import { Cognito } from './cognito';

// Mock the AWS SDK
vi.mock('@aws-sdk/client-cognito-identity-provider');

// Mock crypto module
vi.mock('node:crypto');

describe('Cognito Client', () => {
  let sut: Cognito;
  let mockConfig: Config;
  let mockCognitoClient: {
    send: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockConfig = {
      aws: {
        region: faker.location.countryCode().toLowerCase(),
        cognitoClientId: faker.string.uuid(),
        cognitoClientSecret: faker.string.alphanumeric(32),
        cognitoUserPoolId: faker.string.uuid(),
      },
    } as Config;

    mockCognitoClient = {
      send: vi.fn(),
    };

    vi.mocked(CognitoIdentityProviderClient).mockImplementation(
      () => mockCognitoClient as unknown as CognitoIdentityProviderClient,
    );

    // Mock crypto functions
    const mockHmac = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue(faker.string.alphanumeric(32)),
    };
    vi.mocked(createHmac).mockReturnValue(
      mockHmac as unknown as ReturnType<typeof createHmac>,
    );

    sut = new Cognito(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should throw error when authentication fails', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      mockCognitoClient.send.mockRejectedValueOnce(
        new Error('Authentication failed'),
      );

      // Act & Assert
      await expect(sut.signIn(input)).rejects.toThrow('Authentication failed');
    });

    it('should throw error when tokens are missing', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const mockAuthResult = { AuthenticationResult: {} };

      mockCognitoClient.send.mockResolvedValueOnce(mockAuthResult);

      // Act & Assert
      await expect(sut.signIn(input)).rejects.toThrow(
        `Cannot authenticate user: ${input.email}`,
      );
    });

    it('should authenticate user successfully', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const mockAuthResult = {
        AuthenticationResult: {
          AccessToken: faker.string.alphanumeric(100),
          RefreshToken: faker.string.alphanumeric(100),
        },
      };

      mockCognitoClient.send.mockResolvedValueOnce(mockAuthResult);

      // Act
      const result = await sut.signIn(input);

      // Assert
      expect(result).toEqual({
        accessToken: mockAuthResult.AuthenticationResult.AccessToken,
        refreshToken: mockAuthResult.AuthenticationResult.RefreshToken,
      });
      expect(mockCognitoClient.send).toHaveBeenCalledWith(
        expect.any(InitiateAuthCommand),
      );
    });
  });

  describe('signUp', () => {
    it('should throw error when registration fails', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        internalId: faker.string.uuid(),
      };

      mockCognitoClient.send.mockRejectedValueOnce(
        new Error('Registration failed'),
      );

      // Act & Assert
      await expect(sut.signUp(input)).rejects.toThrow('Registration failed');
    });

    it('should throw error when UserSub is missing', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        internalId: faker.string.uuid(),
      };
      const mockSignUpResult = {};

      mockCognitoClient.send.mockResolvedValueOnce(mockSignUpResult);

      // Act & Assert
      await expect(sut.signUp(input)).rejects.toThrow(
        `Cannot signup user: ${input.email}`,
      );
    });

    it('should register user successfully', async () => {
      // Arrange
      const input = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        internalId: faker.string.uuid(),
      };
      const mockSignUpResult = {
        UserSub: faker.string.uuid(),
      };

      mockCognitoClient.send.mockResolvedValueOnce(mockSignUpResult);

      // Act
      const result = await sut.signUp(input);

      // Assert
      expect(result).toEqual({
        externalId: mockSignUpResult.UserSub,
      });
      expect(mockCognitoClient.send).toHaveBeenCalledWith(
        expect.any(SignUpCommand),
      );
    });
  });

  describe('addToGroup', () => {
    it('should throw error when add to group fails', async () => {
      // Arrange
      const input = {
        username: faker.internet.username(),
        groupName: faker.word.noun(),
      };

      mockCognitoClient.send.mockRejectedValueOnce(
        new Error('Add to group failed'),
      );

      // Act & Assert
      await expect(sut.addToGroup(input)).rejects.toThrow('Add to group failed');
    });

    it('should add user to group successfully', async () => {
      // Arrange
      const input = {
        username: faker.internet.username(),
        groupName: faker.word.noun(),
      };

      mockCognitoClient.send.mockResolvedValueOnce({});

      // Act
      await sut.addToGroup(input);

      // Assert
      expect(mockCognitoClient.send).toHaveBeenCalledWith(
        expect.any(AdminAddUserToGroupCommand),
      );
    });
  });

  describe('deleteUser', () => {
    it('should throw error when delete user fails', async () => {
      // Arrange
      const input = { externalId: faker.string.uuid() };

      mockCognitoClient.send.mockRejectedValueOnce(
        new Error('Delete user failed'),
      );

      // Act & Assert
      await expect(sut.deleteUser(input)).rejects.toThrow('Delete user failed');
    });

    it('should delete user successfully', async () => {
      // Arrange
      const input = { externalId: faker.string.uuid() };

      mockCognitoClient.send.mockResolvedValueOnce({});

      // Act
      await sut.deleteUser(input);

      // Assert
      expect(mockCognitoClient.send).toHaveBeenCalledWith(
        expect.any(AdminDeleteUserCommand),
      );
    });
  });

  describe('removeFromGroup', () => {
    it('should throw error when remove from group fails', async () => {
      // Arrange
      const input = {
        username: faker.internet.username(),
        groupName: faker.word.noun(),
      };

      mockCognitoClient.send.mockRejectedValueOnce(
        new Error('Remove from group failed'),
      );

      // Act & Assert
      await expect(sut.removeFromGroup(input)).rejects.toThrow(
        'Remove from group failed',
      );
    });

    it('should remove user from group successfully', async () => {
      // Arrange
      const input = {
        username: faker.internet.username(),
        groupName: faker.word.noun(),
      };

      mockCognitoClient.send.mockResolvedValueOnce({});

      // Act
      await sut.removeFromGroup(input);

      // Assert
      expect(mockCognitoClient.send).toHaveBeenCalledWith(
        expect.any(AdminRemoveUserFromGroupCommand),
      );
    });
  });
});
