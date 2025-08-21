import { beforeEach, describe, expect, it } from 'vitest';
import { User, UserRole, type UserProps } from './user';

describe('User Entity', () => {
  let userProps: UserProps;

  beforeEach(() => {
    userProps = {
      id: 'test-id',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: UserRole.USER,
      isOnboarded: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      deletedAt: null,
    };
  });

  describe('constructor', () => {
    it('should create a user with given props', () => {
      // Arrange
      const expectedProps = userProps;

      // Act
      const sut = new User(expectedProps);

      // Assert
      expect(sut.id).toBe(expectedProps.id);
      expect(sut.name).toBe(expectedProps.name);
      expect(sut.email).toBe(expectedProps.email);
      expect(sut.role).toBe(expectedProps.role);
      expect(sut.isOnboarded).toBe(expectedProps.isOnboarded);
      expect(sut.createdAt).toBe(expectedProps.createdAt);
      expect(sut.updatedAt).toBe(expectedProps.updatedAt);
      expect(sut.deletedAt).toBe(expectedProps.deletedAt);
    });
  });

  describe('create', () => {
    it('should create a user with minimal props', () => {
      // Arrange
      const createProps = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      };

      // Act
      const sut = User.create(createProps);

      // Assert
      expect(sut.id).toBeDefined();
      expect(sut.name).toBe(createProps.name);
      expect(sut.email).toBe(createProps.email);
      expect(sut.role).toBe(UserRole.USER);
      expect(sut.isOnboarded).toBe(false);
      expect(sut.createdAt).toBeInstanceOf(Date);
      expect(sut.updatedAt).toBeUndefined();
      expect(sut.deletedAt).toBeUndefined();
    });

    it('should create a user with custom role', () => {
      // Arrange
      const createProps = {
        name: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      // Act
      const sut = User.create(createProps);

      // Assert
      expect(sut.role).toBe(UserRole.ADMIN);
    });

    it('should create a user with custom id', () => {
      // Arrange
      const customId = 'custom-id';
      const createProps = {
        id: customId,
        name: 'Test User',
        email: 'test@example.com',
      };

      // Act
      const sut = User.create(createProps);

      // Assert
      expect(sut.id).toBe(customId);
    });

    it('should create a user with custom onboarded status', () => {
      // Arrange
      const createProps = {
        name: 'Onboarded User',
        email: 'onboarded@example.com',
        isOnboarded: true,
      };

      // Act
      const sut = User.create(createProps);

      // Assert
      expect(sut.isOnboarded).toBe(true);
    });
  });

  describe('markAsOnboarded', () => {
    it('should mark user as onboarded and update timestamp', () => {
      // Arrange
      const initialProps = { ...userProps, isOnboarded: false };
      const sut = new User(initialProps);
      const originalUpdatedAt = sut.updatedAt;

      // Act
      sut.markAsOnboarded();

      // Assert
      expect(sut.isOnboarded).toBe(true);
      expect(sut.updatedAt).not.toBe(originalUpdatedAt);
      expect(sut.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('UserRole', () => {
    it('should have correct role values', () => {
      // Arrange & Act & Assert (static values)
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.USER).toBe('user');
    });
  });
});
