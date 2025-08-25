import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { EditAccountController } from './edit-account';
import { UserRole } from '@/domain/entities/user';
import type { EditAccountUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';

describe('EditAccountController', () => {
  let userId: string;
  let currentUserId: string;
  let userName: string;
  let userEmail: string;
  let body: Record<string, unknown>;
  let user: { id: string; roles: UserRole[] };
  let sut: EditAccountController;
  let editAccountUseCase: EditAccountUseCase;

  beforeAll(() => {
    userId = faker.string.uuid();
    currentUserId = faker.string.uuid();
    userName = faker.person.fullName();
    userEmail = faker.internet.email();
    body = {
      userId,
      name: userName,
      role: UserRole.ADMIN,
    };
    user = { id: currentUserId, roles: [UserRole.ADMIN] };
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

  it('should throw ZodError when userId is invalid', async () => {
    const request: HttpRequest = {
      body: { userId: 'invalid-uuid', name: userName },
      user,
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when name is empty', async () => {
    const request: HttpRequest = {
      body: { userId, name: '' },
      user,
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when role is invalid', async () => {
    const request: HttpRequest = {
      body: { userId, role: 'INVALID_ROLE' },
      user,
      headers: {},
    } as unknown as HttpRequest;

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when no fields provided', async () => {
    const request: HttpRequest = {
      body: { userId },
      user,
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should call EditAccountUseCase with correct input', async () => {
    const request: HttpRequest = { body, user, headers: {} };

    await sut.handle(request);

    expect(editAccountUseCase).toHaveBeenCalledWith({
      userId,
      currentUserId,
      currentUserRoles: [UserRole.ADMIN],
      name: userName,
      role: UserRole.ADMIN,
    });
    expect(editAccountUseCase).toHaveBeenCalledTimes(1);
  });

  it('should return 200 with valid data', async () => {
    const request: HttpRequest = { body, user, headers: {} };

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
});
