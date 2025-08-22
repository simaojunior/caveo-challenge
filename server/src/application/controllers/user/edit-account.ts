import z from 'zod';
import { UserRole } from '@/domain/entities/user';
import { httpResponse } from '@/application/helpers/http';
import {
  Controller,
  type HttpRequest,
  type HttpResponse,
} from '@/application/contracts';
import type { EditAccountUseCase } from '@/domain/use-cases';

const inputSchema = z.object({
  userId: z.uuid(),
  name: z.string().min(1, 'Name must not be empty').optional(),
  role: z.enum(UserRole).optional(),
}).refine(
  (data) => data.name !== undefined || data.role !== undefined,
  {
    message: 'At least one field (name or role) must be provided',
    path: ['general'],
  },
);

export class EditAccountController extends Controller {
  constructor(private readonly editAccountUseCase: EditAccountUseCase) {
    super();
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const  { name, role, userId } = inputSchema.parse(request.body);

    const { id, email, isOnboarded } = await this.editAccountUseCase({
      userId,
      currentUserId: request.user?.id,
      currentUserRoles: request.user?.roles,
      name,
      role,
    });

    return httpResponse.ok({
      id,
      name,
      email,
      isOnboarded,
    });
  }
}
