import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetMeController } from './get-me';
import { UserRole } from '@/domain/entities/user';
import type { GetMeUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';
import { ResourceNotFound } from '@/application/errors';

describe('GetMeController', () => {
  let userId: string;
  let userName: string;
  let userEmail: string;
  let userRoles: UserRole[];
  let sut: GetMeController;
  let getMeUseCase: GetMeUseCase;

  beforeAll(() => {
    userId = faker.string.uuid();
    userName = faker.person.fullName();
    userEmail = faker.internet.email();
    userRoles = [UserRole.USER];
    getMeUseCase = vi.fn().mockResolvedValue({
      id: userId,
      name: userName,
      email: userEmail,
      role: UserRole.USER,
      isOnboarded: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetMeController(getMeUseCase);
  });

  it('should extend Controller', () => {
    expect(sut).toBeInstanceOf(Controller);
  });

  it('should call GetMeUseCase with correct parameters', async () => {
    const request: HttpRequest = {
      user: { id: userId, roles: userRoles },
      headers: {},
      body: {},
    };

    await sut.handle(request);

    expect(getMeUseCase).toHaveBeenCalledWith({
      id: userId,
      roles: userRoles,
    });
    expect(getMeUseCase).toHaveBeenCalledTimes(1);
  });

  it('should return 200 with user data', async () => {
    const request: HttpRequest = {
      user: { id: userId, roles: userRoles },
      headers: {},
      body: {},
    };

    const response = await sut.handle(request);

    expect(response).toEqual({
      statusCode: 200,
      data: {
        id: userId,
        name: userName,
        email: userEmail,
        role: UserRole.USER,
        isOnboarded: true,
      },
    });
  });

  it('should handle admin user correctly', async () => {
    const adminRoles = [UserRole.ADMIN];
    const request: HttpRequest = {
      user: { id: userId, roles: adminRoles },
      headers: {},
      body: {},
    };

    await sut.handle(request);

    expect(getMeUseCase).toHaveBeenCalledWith({
      id: userId,
      roles: adminRoles,
    });
  });

  it('should propagate use case errors', async () => {
    const request: HttpRequest = {
      user: { id: userId, roles: userRoles },
      headers: {},
      body: {},
    };

    const error = new ResourceNotFound('User not found');
    vi.mocked(getMeUseCase).mockRejectedValue(error);

    await expect(sut.handle(request)).rejects.toThrow('User not found');
  });
});
