import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { SigninOrRegisterController } from './signin-or-register';
import { UserRole } from '@/domain/entities/user';
import type { SigninOrRegisterUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest } from '@/application/contracts';

describe('SigninOrRegisterController', () => {
  let userEmail: string;
  let userName: string;
  let accessToken: string;
  let refreshToken: string;
  let body: Record<string, unknown>;
  let sut: SigninOrRegisterController;
  let signinOrRegisterUseCase: SigninOrRegisterUseCase;

  beforeAll(() => {
    userEmail = faker.internet.email();
    userName = faker.person.fullName();
    accessToken = faker.string.alphanumeric(100);
    refreshToken = faker.string.alphanumeric(100);
    body = {
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

  it('should throw ZodError when email is invalid', async () => {
    const request: HttpRequest = {
      body: { email: 'invalid-email', password: 'Password123!' },
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when password is too short', async () => {
    const request: HttpRequest = {
      body: { email: userEmail, password: 'Pass1!' },
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when password lacks uppercase', async () => {
    const request: HttpRequest = {
      body: { email: userEmail, password: 'password123!' },
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when password lacks special character', async () => {
    const request: HttpRequest = {
      body: { email: userEmail, password: 'Password123' },
      headers: {},
    };

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should throw ZodError when role is invalid', async () => {
    const request: HttpRequest = {
      body: { email: userEmail, password: 'Password123!', role: 'INVALID_ROLE' },
      headers: {},
    } as unknown as HttpRequest;

    await expect(sut.handle(request)).rejects.toThrow(z.ZodError);
  });

  it('should call SigninOrRegisterUseCase with correct input', async () => {
    const request: HttpRequest = { body, headers: {} };

    await sut.handle(request);

    expect(signinOrRegisterUseCase).toHaveBeenCalledWith({
      email: userEmail,
      password: 'Password123!',
      name: userName,
      role: UserRole.ADMIN,
    });
    expect(signinOrRegisterUseCase).toHaveBeenCalledTimes(1);
  });

  it('should return 200 with valid data', async () => {
    const request: HttpRequest = { body, headers: {} };

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
});
