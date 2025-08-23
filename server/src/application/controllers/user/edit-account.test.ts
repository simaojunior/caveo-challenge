import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EditAccountController } from './edit-account';
import { UserRole } from '@/domain/entities/user';
import type { EditAccountUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';
import { ResourceNotFound } from '@/application/errors';
import { InsufficientPermissionsError } from '@/domain/errors';

describe('EditAccountController', () => {
  let userId: string;
  let currentUserId: string;
  let userName: string;
  let userEmail: string;
  let currentUserRoles: UserRole[];
  let basicRequestBody: Record<string, unknown>;
  let fullRequestBody: Record<string, unknown>;
  let sut: EditAccountController;
  let editAccountUseCase: EditAccountUseCase;

  beforeAll(() => {
    userId = faker.string.uuid();
    currentUserId = faker.string.uuid();
    userName = faker.person.fullName();
    userEmail = faker.internet.email();
    currentUserRoles = [UserRole.ADMIN];
    basicRequestBody = {
      userId,
      name: userName,
    };
    fullRequestBody = {
      userId,
      name: userName,
      role: UserRole.ADMIN,
    };
    editAccountUseCase = vi.fn().mockResolvedValue({
      id: userId,
      name: userName,
      email: userEmail,
      role: UserRole.USER,
      isOnboarded: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new EditAccountController(editAccountUseCase);
  });

  it('should extend Controller', () => {
    expect(sut).toBeInstanceOf(Controller);
  });

  it('should call EditAccountUseCase with correct parameters for name update', async () => {
    const request: HttpRequest = {
      body: basicRequestBody,
      user: { id: currentUserId, roles: currentUserRoles },
      headers: {},
    };

    await sut.handle(request);

    expect(editAccountUseCase).toHaveBeenCalledWith({
      userId,
      currentUserId,
      currentUserRoles,
      name: userName,
      role: undefined,
    });
    expect(editAccountUseCase).toHaveBeenCalledTimes(1);
  });

  it('should call EditAccountUseCase with correct parameters for full update', async () => {
    const request: HttpRequest = {
      body: fullRequestBody,
      user: { id: currentUserId, roles: currentUserRoles },
      headers: {},
    };

    await sut.handle(request);

    expect(editAccountUseCase).toHaveBeenCalledWith({
      userId,
      currentUserId,
      currentUserRoles,
      name: userName,
      role: UserRole.ADMIN,
    });
  });

  it('should return 200 with user data excluding role', async () => {
    const request: HttpRequest = {
      body: basicRequestBody,
      user: { id: currentUserId, roles: currentUserRoles },
      headers: {},
    };

    const response = await sut.handle(request);

    expect(response).toEqual({
      statusCode: 200,
      data: {
        id: userId,
        name: userName,
        email: userEmail,
        isOnboarded: true,
      },
    });
  });

  it('should handle missing user context', async () => {
    const request: HttpRequest = {
      body: basicRequestBody,
      user: undefined,
      headers: {},
    };

    await sut.handle(request);

    expect(editAccountUseCase).toHaveBeenCalledWith({
      userId,
      currentUserId: undefined,
      currentUserRoles: undefined,
      name: userName,
      role: undefined,
    });
  });

  it('should propagate ResourceNotFound errors', async () => {
    const request: HttpRequest = {
      body: basicRequestBody,
      user: { id: currentUserId, roles: currentUserRoles },
      headers: {},
    };

    const error = new ResourceNotFound('User not found');
    vi.mocked(editAccountUseCase).mockRejectedValue(error);

    await expect(sut.handle(request)).rejects.toThrow('User not found');
  });

  it('should propagate InsufficientPermissionsError', async () => {
    const request: HttpRequest = {
      body: fullRequestBody,
      user: { id: currentUserId, roles: [UserRole.USER] },
      headers: {},
    };

    const error = new InsufficientPermissionsError('Insufficient permissions');
    vi.mocked(editAccountUseCase).mockRejectedValue(error);

    await expect(sut.handle(request)).rejects.toThrow('Insufficient permissions');
  });
});
