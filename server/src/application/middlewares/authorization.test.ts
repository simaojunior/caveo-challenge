import { describe, it, expect, beforeEach } from 'vitest';
import { AuthorizationMiddleware } from './authorization';
import type { HttpRequest } from '@/application/contracts';

describe('AuthorizationMiddleware', () => {
  let sut: AuthorizationMiddleware;

  beforeEach(() => {
    sut = new AuthorizationMiddleware(['admin']);
  });

  it('should return 401 if user is not authenticated', async () => {
    const httpResponse = await sut.handle({});

    expect(httpResponse).toEqual({
      statusCode: 401,
      data: {
        name: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
  });

  it('should return 403 when user does not have required role', async () => {
    const request: HttpRequest = {
      user: {
        id: 'user-123',
        roles: ['user'],
        jwt: 'jwt-token',
      },
    };

    const httpResponse = await sut.handle(request);

    expect(httpResponse).toEqual({
      statusCode: 403,
      data: {
        name: 'FORBIDDEN',
        message: 'Insufficient permissions. Missing roles: admin',
      },
    });
  });

  it('should return 200 when user has the required role', async () => {
    const request: HttpRequest = {
      user: {
        id: 'user-123',
        roles: ['admin'],
        jwt: 'jwt-token',
      },
    };

    const httpResponse = await sut.handle(request);

    expect(httpResponse).toEqual({
      statusCode: 200,
      data: null,
    });
  });

  it('should return 200 when user has one of multiple required roles', async () => {
    sut = new AuthorizationMiddleware(['admin', 'user']);

    const request: HttpRequest = {
      user: {
        id: 'user-123',
        roles: ['user'],
        jwt: 'jwt-token',
      },
    };

    const httpResponse = await sut.handle(request);

    expect(httpResponse).toEqual({
      statusCode: 200,
      data: null,
    });
  });

  it('should handle empty roles array', async () => {
    const request: HttpRequest = {
      user: {
        id: 'user-123',
        roles: [],
        jwt: 'jwt-token',
      },
    };

    const httpResponse = await sut.handle(request);

    expect(httpResponse).toEqual({
      statusCode: 403,
      data: {
        name: 'FORBIDDEN',
        message: 'Insufficient permissions. Missing roles: admin',
      },
    });
  });
});
