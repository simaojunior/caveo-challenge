import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { SearchUsersController } from './search-users';
import { UserRole } from '@/domain/entities/user';
import type { SearchUsersUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';
import { ItemPerPage } from '@/domain/contracts/repos/user';

describe('SearchUsersController', () => {
  let userId: string;
  let userName: string;
  let userEmail: string;
  let query: Record<string, unknown>;
  let sut: SearchUsersController;
  let searchUsersUseCase: SearchUsersUseCase;

  beforeAll(() => {
    userId = faker.string.uuid();
    userName = faker.person.fullName();
    userEmail = faker.internet.email();
    query = {
      id: userId,
      name: userName,
      email: userEmail,
      role: UserRole.ADMIN,
      isOnboarded: 'true',
      itemsPerPage: ItemPerPage.TWENTY,
      page: '2',
    };
    searchUsersUseCase = vi.fn().mockResolvedValue({
      users: [
        {
          id: userId,
          name: userName,
          email: userEmail,
          role: UserRole.USER,
          isOnboarded: true,
        },
      ],
      meta: {
        total: 1,
        itemsPerPage: 10,
        totalPages: 1,
        page: 1,
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new SearchUsersController(searchUsersUseCase);
  });

  it('should extend Controller', () => {
    expect(sut).toBeInstanceOf(Controller);
  });

  it('should throw ZodError when id is invalid', async () => {
    const request: HttpRequest = {
      query: { id: 'invalid-uuid' },
      headers: {},
      body: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when name is too short', async () => {
    const request: HttpRequest = {
      query: { name: 'x' },
      headers: {},
      body: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when email is invalid', async () => {
    const request: HttpRequest = {
      query: { email: 'invalid-email' },
      headers: {},
      body: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when role is invalid', async () => {
    const request: HttpRequest = {
      query: { role: 'INVALID_ROLE' },
      headers: {},
      body: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when itemsPerPage is invalid', async () => {
    const request: HttpRequest = {
      query: { itemsPerPage: '999' },
      headers: {},
      body: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should call SearchUsersUseCase with correct input', async () => {
    const request: HttpRequest = { query, headers: {}, body: {} };

    await sut.handle(request);

    expect(searchUsersUseCase).toHaveBeenCalledWith({
      id: userId,
      name: userName,
      email: userEmail,
      role: UserRole.ADMIN,
      isOnboarded: true,
      pagination: {
        itemsPerPage: ItemPerPage.TWENTY,
        page: 2,
      },
    });
    expect(searchUsersUseCase).toHaveBeenCalledTimes(1);
  });

  it('should return 200 with valid data', async () => {
    const request: HttpRequest = { query, headers: {}, body: {} };

    const response = await sut.handle(request);

    expect(response).toEqual({
      statusCode: 200,
      data: {
        users: [
          {
            id: userId,
            name: userName,
            email: userEmail,
            role: UserRole.USER,
            isOnboarded: true,
          },
        ],
        meta: {
          total: 1,
          itemsPerPage: 10,
          totalPages: 1,
          page: 1,
        },
      },
    });
  });
});
