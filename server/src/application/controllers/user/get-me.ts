import z from 'zod';

import type { GetMeUseCase } from '@/domain/use-cases';
import { httpResponse } from '@/application/helpers/http';
import { Controller, type HttpRequest, type HttpResponse } from '@/application/contracts';
import { UserRole } from '@/domain/entities/user';

const inputSchema = z.object({
  id: z.string().min(1),
  roles: z.array(z.enum(UserRole)),
});

export class GetMe extends Controller {
  constructor(private readonly getMeUseCase: GetMeUseCase) {
    super();
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id, roles } = inputSchema.parse(request.user);

    const user = await this.getMeUseCase({
      id,
      roles,
    });

    return httpResponse.ok(user);
  }
}
