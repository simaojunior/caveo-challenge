import z from 'zod';

import { UserRole } from '@/domain/entities/user';
import { httpResponse } from '@/application/helpers/http';
import type { SigninOrRegisterUseCase } from '@/domain/use-cases';
import { Controller, type HttpRequest, type HttpResponse } from '@/application/contracts';

const inputSchema = z.object({
  email: z.email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(UserRole).optional(),
});

export class SigninOrRegister extends Controller {
  constructor(
    private readonly signinOrRegisterUseCase: SigninOrRegisterUseCase,
  ) {
    super();
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { email, password, name, role } = inputSchema.parse(request?.body);

    const {
      accessToken,
      refreshToken,
      isOnboarded,
      isNewUser,
    } = await this.signinOrRegisterUseCase({ email, password, name, role });

    if (isNewUser) {
      return httpResponse.created({ accessToken, refreshToken, isOnboarded });
    }

    return httpResponse.ok({ accessToken, refreshToken, isOnboarded });
  }
}
