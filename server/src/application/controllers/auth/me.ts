import z from 'zod';

import type { MeUseCase } from '@/domain/use-cases';
import { httpResponse } from '@/application/helpers/http';
import { Controller, type HttpRequest, type HttpResponse } from '@/application/contracts';
import { UserRole } from '@/domain/entities/user';

const inputSchema = z.object({
  id: z.string().min(1),
  roles: z.array(z.enum(UserRole)),
});

export class Me extends Controller {
  constructor(private readonly meUseCase: MeUseCase) {
    super();
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id, roles } = inputSchema.parse(request.user);

    const user = await this.meUseCase({
      id,
      roles,
    });

    return httpResponse.ok(user);
  }
}
