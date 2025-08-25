import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { GetMeController } from './get-me';
import { UserRole } from '@/domain/entities/user';
import type { GetMeUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';

describe('GetMeController', () => {
  let userId: string;
  let userName: string;
  let userEmail: string;
  let user: { id: string; roles: UserRole[] };
  let sut: GetMeController;
  let getMeUseCase: GetMeUseCase;

  beforeAll(() => {
    userId = faker.string.uuid();
    userName = faker.person.fullName();
    userEmail = faker.internet.email();
    user = { id: userId, roles: [UserRole.USER] };
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

  it('should throw ZodError when id is empty', async () => {
    const request: HttpRequest = {
      user: { id: '', roles: [UserRole.USER] },
      headers: {},
      body: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when roles is invalid', async () => {
    const invalidUser = { id: userId, roles: ['INVALID_ROLE'] };
    const request: HttpRequest = {
      user: invalidUser,
      headers: {},
      body: {},
    } as unknown as HttpRequest;

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should call GetMeUseCase with correct input', async () => {
    const request: HttpRequest = { user, headers: {}, body: {} };

    await sut.handle(request);

    expect(getMeUseCase).toHaveBeenCalledWith({
      id: userId,
      roles: [UserRole.USER],
    });
    expect(getMeUseCase).toHaveBeenCalledTimes(1);
  });

  it('should return 200 with valid data', async () => {
    const request: HttpRequest = { user, headers: {}, body: {} };

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
});
