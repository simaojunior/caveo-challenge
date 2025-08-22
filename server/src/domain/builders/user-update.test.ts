import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it } from 'vitest';

import { UserUpdateBuilder } from './user-update';
import { User, UserRole, type UserProps } from '../entities/user';

describe('UserUpdateBuilder', () => {
  let baseUserProps: UserProps;

  beforeEach(() => {
    baseUserProps = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: UserRole.USER,
      isOnboarded: false,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      deletedAt: null,
    };
  });

  describe('constructor', () => {
    it('should initialize with base user data', () => {
      // Act
      const builder = new UserUpdateBuilder(baseUserProps);

      // Assert
      const { user, shouldMarkOnboarded } = builder.build();

      expect(user.id).toBe(baseUserProps.id);
      expect(user.name).toBe(baseUserProps.name);
      expect(user.email).toBe(baseUserProps.email);
      expect(user.role).toBe(baseUserProps.role);
      expect(shouldMarkOnboarded).toBe(false);
    });
  });

  describe('withName', () => {
    it('should update name when provided', () => {
      // Arrange
      const newName = faker.person.fullName();
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user, shouldMarkOnboarded } = builder
        .withName(newName)
        .build();

      // Assert
      expect(user.name).toBe(newName);
      expect(shouldMarkOnboarded).toBe(true);
    });

    it('should not update name when undefined provided', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user, shouldMarkOnboarded } = builder
        .withName(undefined)
        .build();

      // Assert
      expect(user.name).toBe(baseUserProps.name);
      expect(shouldMarkOnboarded).toBe(false);
    });

    it('should not update name when empty string provided', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user, shouldMarkOnboarded } = builder
        .withName('')
        .build();

      // Assert
      expect(user.name).toBe(baseUserProps.name);
      expect(shouldMarkOnboarded).toBe(false);
    });

    it('should return this for method chaining', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const result = builder.withName(faker.person.fullName());

      // Assert
      expect(result).toBe(builder);
    });

    it('should mark onboard when name is provided', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { shouldMarkOnboarded } = builder
        .withName(faker.person.fullName())
        .build();

      // Assert
      expect(shouldMarkOnboarded).toBe(true);
    });
  });

  describe('withRole', () => {
    it('should update role when provided and canEditRole is true', () => {
      // Arrange
      const newRole = UserRole.ADMIN;
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user } = builder
        .withRole(newRole, true)
        .build();

      // Assert
      expect(user.role).toBe(newRole);
    });

    it('should not update role when canEditRole is false', () => {
      // Arrange
      const newRole = UserRole.ADMIN;
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user } = builder
        .withRole(newRole, false)
        .build();

      // Assert
      expect(user.role).toBe(baseUserProps.role);
    });

    it('should not update role when role is undefined', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user } = builder
        .withRole(undefined, true)
        .build();

      // Assert
      expect(user.role).toBe(baseUserProps.role);
    });

    it('should return this for method chaining', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const result = builder.withRole(UserRole.ADMIN, true);

      // Assert
      expect(result).toBe(builder);
    });

    it('should not mark onboard when only role is changed', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { shouldMarkOnboarded } = builder
        .withRole(UserRole.ADMIN, true)
        .build();

      // Assert
      expect(shouldMarkOnboarded).toBe(false);
    });
  });

  describe('build', () => {
    it('should create User entity with merged data', () => {
      // Arrange
      const newName = faker.person.fullName();
      const newRole = UserRole.ADMIN;
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user } = builder
        .withName(newName)
        .withRole(newRole, true)
        .build();

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(baseUserProps.id);
      expect(user.name).toBe(newName);
      expect(user.email).toBe(baseUserProps.email);
      expect(user.role).toBe(newRole);
      expect(user.isOnboarded).toBe(baseUserProps.isOnboarded);
      expect(user.createdAt).toBe(baseUserProps.createdAt);
    });

    it('should return shouldMarkOnboarded as true when name was changed', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { shouldMarkOnboarded } = builder
        .withName(faker.person.fullName())
        .withRole(UserRole.ADMIN, true)
        .build();

      // Assert
      expect(shouldMarkOnboarded).toBe(true);
    });

    it('should return shouldMarkOnboarded as false when only role was changed', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { shouldMarkOnboarded } = builder
        .withRole(UserRole.ADMIN, true)
        .build();

      // Assert
      expect(shouldMarkOnboarded).toBe(false);
    });

    it('should return shouldMarkOnboarded as false when no changes were made', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { shouldMarkOnboarded } = builder.build();

      // Assert
      expect(shouldMarkOnboarded).toBe(false);
    });

    it('should preserve base user data when no updates are applied', () => {
      // Arrange
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user } = builder.build();

      // Assert
      expect(user.id).toBe(baseUserProps.id);
      expect(user.name).toBe(baseUserProps.name);
      expect(user.email).toBe(baseUserProps.email);
      expect(user.role).toBe(baseUserProps.role);
      expect(user.isOnboarded).toBe(baseUserProps.isOnboarded);
    });
  });

  describe('fluent interface', () => {
    it('should allow chaining multiple operations', () => {
      // Arrange
      const newName = faker.person.fullName();
      const newRole = UserRole.ADMIN;
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user, shouldMarkOnboarded } = builder
        .withName(newName)
        .withRole(newRole, true)
        .build();

      // Assert
      expect(user.name).toBe(newName);
      expect(user.role).toBe(newRole);
      expect(shouldMarkOnboarded).toBe(true);
    });

    it('should work with different chaining orders', () => {
      // Arrange
      const newName = faker.person.fullName();
      const newRole = UserRole.ADMIN;
      const builder = new UserUpdateBuilder(baseUserProps);

      // Act
      const { user, shouldMarkOnboarded } = builder
        .withRole(newRole, true)
        .withName(newName)
        .build();

      // Assert
      expect(user.name).toBe(newName);
      expect(user.role).toBe(newRole);
      expect(shouldMarkOnboarded).toBe(true);
    });
  });
});
