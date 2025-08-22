import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthenticationMiddleware } from './authentication';
import type { ITokenValidator } from '@/domain/contracts/gateways/token';
import type { HttpRequest } from '@/application/contracts';
import type { UserRole } from '@/domain/entities/user';

describe('AuthenticationMiddleware', () => {
  let sut: AuthenticationMiddleware;
  let mockTokenValidator: ITokenValidator;

  beforeEach(() => {
    mockTokenValidator = {
      validate: vi.fn(),
    };
    sut = new AuthenticationMiddleware(mockTokenValidator);
  });

  it('should return 401 if authorization header is missing', async () => {
    const httpResponse = await sut.handle({ headers: {} });

    expect(httpResponse).toEqual({
      statusCode: 401,
      data: {
        name: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
  });

  it('should return 401 if authorization header is empty', async () => {
    const httpResponse = await sut.handle({
      headers: { authorization: '' },
    });

    expect(httpResponse).toEqual({
      statusCode: 401,
      data: {
        name: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
  });

  it('should return 401 if authorization header is not Bearer', async () => {
    const httpResponse = await sut.handle({
      headers: { authorization: 'Basic token123' },
    });

    expect(httpResponse).toEqual({
      statusCode: 401,
      data: {
        name: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
  });

  it('should call tokenValidator with correct token', async () => {
    const token = 'valid-jwt-token';
    const request: HttpRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    vi.mocked(mockTokenValidator.validate).mockResolvedValueOnce({
      internalId: 'user-123',
      roles: ['user'],
    });

    await sut.handle(request);

    expect(mockTokenValidator.validate).toHaveBeenCalledWith({ token });
    expect(mockTokenValidator.validate).toHaveBeenCalledTimes(1);
  });

  it('should return 401 if tokenValidator throws', async () => {
    const token = 'invalid-token';
    const request: HttpRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    vi.mocked(mockTokenValidator.validate).mockRejectedValueOnce(
      new Error('Token validation failed'),
    );

    const httpResponse = await sut.handle(request);

    expect(httpResponse).toEqual({
      statusCode: 401,
      data: {
        name: 'UNAUTHORIZED',
        message: 'Invalid token',
      },
    });
  });

  it('should return 200 with user data and set request.user on success', async () => {
    const token = 'valid-jwt-token';
    const internalId = 'user-123';
    const roles: UserRole[] = ['admin', 'user'];
    const request: HttpRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    vi.mocked(mockTokenValidator.validate).mockResolvedValueOnce({
      internalId,
      roles,
    });

    const httpResponse = await sut.handle(request);

    expect(httpResponse).toEqual({
      statusCode: 200,
      data: {
        user: {
          id: internalId,
          roles,
          jwt: token,
        },
      },
    });

    expect(request.user).toEqual({
      id: internalId,
      roles,
      jwt: token,
    });
  });
});
