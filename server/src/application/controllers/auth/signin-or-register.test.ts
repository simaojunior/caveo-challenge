import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SigninOrRegisterController } from './signin-or-register';
import { UserRole } from '@/domain/entities/user';
import type { SigninOrRegisterUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';

describe('SigninOrRegisterController', () => {
  let userEmail: string;
  let userName: string;
  let accessToken: string;
  let refreshToken: string;
  let basicRequestBody: Record<string, unknown>;
  let fullRequestBody: Record<string, unknown>;
  let sut: SigninOrRegisterController;
  let signinOrRegisterUseCase: SigninOrRegisterUseCase;

  beforeAll(() => {
    userEmail = faker.internet.email();
    userName = faker.person.fullName();
    accessToken = faker.string.alphanumeric(100);
    refreshToken = faker.string.alphanumeric(100);
    basicRequestBody = {
      email: userEmail,
      password: 'Password123!',
    };
    fullRequestBody = {
      email: userEmail,
      password: 'Password123!',
      name: userName,
      role: UserRole.ADMIN,
    };
    signinOrRegisterUseCase = vi.fn().mockResolvedValue({
      accessToken,
      refreshToken,
      isOnboarded: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new SigninOrRegisterController(signinOrRegisterUseCase);
  });

  it('should extend Controller', () => {
    expect(sut).toBeInstanceOf(Controller);
  });

  it('should call SigninOrRegisterUseCase with correct parameters for basic signin', async () => {
    const request: HttpRequest = {
      body: basicRequestBody,
      headers: {},
    };

    await sut.handle(request);

    expect(signinOrRegisterUseCase).toHaveBeenCalledWith({
      email: userEmail,
      password: 'Password123!',
      name: undefined,
      role: undefined,
    });
    expect(signinOrRegisterUseCase).toHaveBeenCalledTimes(1);
  });

  it('should call SigninOrRegisterUseCase with all provided fields', async () => {
    const request: HttpRequest = {
      body: fullRequestBody,
      headers: {},
    };

    await sut.handle(request);

    expect(signinOrRegisterUseCase).toHaveBeenCalledWith({
      email: userEmail,
      password: 'Password123!',
      name: userName,
      role: UserRole.ADMIN,
    });
  });

  it('should return 200 with authentication tokens', async () => {
    const request: HttpRequest = {
      body: basicRequestBody,
      headers: {},
    };

    const response = await sut.handle(request);

    expect(response).toEqual({
      statusCode: 200,
      data: {
        accessToken,
        refreshToken,
        isOnboarded: true,
      },
    });
  });

  it('should handle new user registration', async () => {
    const newUserResponse = {
      accessToken: faker.string.alphanumeric(100),
      refreshToken: faker.string.alphanumeric(100),
      isOnboarded: false,
      isNewUser: true,
    };

    vi.mocked(signinOrRegisterUseCase).mockResolvedValue(newUserResponse);

    const request: HttpRequest = {
      body: basicRequestBody,
      headers: {},
    };

    const response = await sut.handle(request);

    expect(response.statusCode).toBe(200);
    expect(response.data).toHaveProperty('isOnboarded', false);
  });

  it('should propagate authentication errors', async () => {
    const request: HttpRequest = {
      body: basicRequestBody,
      headers: {},
    };

    const error = new Error('Authentication failed');
    vi.mocked(signinOrRegisterUseCase).mockRejectedValue(error);

    await expect(sut.handle(request)).rejects.toThrow('Authentication failed');
  });

  it('should validate password requirements', async () => {
    const weakPasswordBody = {
      email: userEmail,
      password: 'weak',
    };
    const request: HttpRequest = {
      body: weakPasswordBody,
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow();
    expect(signinOrRegisterUseCase).not.toHaveBeenCalled();
  });
});
