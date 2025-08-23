import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchUsersController } from './search-users';
import { UserRole } from '@/domain/entities/user';
import type { SearchUsersUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';
import { ItemPerPage } from '@/domain/contracts/repos/user';

describe('SearchUsersController', () => {
  let userId: string;
  let userName: string;
  let userEmail: string;
  let basicQuery: Record<string, unknown>;
  let filteredQuery: Record<string, unknown>;
  let sut: SearchUsersController;
  let searchUsersUseCase: SearchUsersUseCase;

  beforeAll(() => {
    userId = faker.string.uuid();
    userName = faker.person.fullName();
    userEmail = faker.internet.email();
    basicQuery = {};
    filteredQuery = {
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

  it('should call SearchUsersUseCase with correct input for basic search', async () => {
    const request: HttpRequest = { query: basicQuery, headers: {}, body: {} };

    await sut.handle(request);

    expect(searchUsersUseCase).toHaveBeenCalledWith({
      pagination: {
        itemsPerPage: ItemPerPage.TEN,
        page: 1,
      },
    });
    expect(searchUsersUseCase).toHaveBeenCalledTimes(1);
  });

  it('should call SearchUsersUseCase with correct input for filtered search', async () => {
    const request: HttpRequest = {
      query: filteredQuery,
      headers: {},
      body: {},
    };

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

  it('should handle isOnboarded string conversion correctly', async () => {
    const queryWithFalse = { isOnboarded: 'false' };
    const request: HttpRequest = {
      query: queryWithFalse,
      headers: {},
      body: {},
    };

    await sut.handle(request);

    expect(searchUsersUseCase).toHaveBeenCalledWith({
      isOnboarded: false,
      pagination: {
        itemsPerPage: ItemPerPage.TEN,
        page: 1,
      },
    });
  });

  it('should not include isOnboarded when not provided', async () => {
    const queryWithoutIsOnboarded = { name: userName };
    const request: HttpRequest = {
      query: queryWithoutIsOnboarded,
      headers: {},
      body: {},
    };

    await sut.handle(request);

    const actualCall = vi.mocked(searchUsersUseCase).mock.calls[0]?.[0];
    expect(actualCall).toBeDefined();
    expect(actualCall).not.toHaveProperty('isOnboarded');
  });

  it('should return 200 with valid data', async () => {
    const request: HttpRequest = { query: basicQuery, headers: {}, body: {} };

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

