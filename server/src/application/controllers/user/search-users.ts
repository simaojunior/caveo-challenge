import z from 'zod';
import { UserRole } from '@/domain/entities/user';
import { httpResponse } from '@/application/helpers/http';
import {
  Controller,
  type HttpRequest,
  type HttpResponse,
} from '@/application/contracts';
import type { SearchUsersUseCase } from '@/domain/use-cases';
import { ItemPerPage } from '@/domain/contracts/repos/user';

const inputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
  role: z.enum(UserRole).optional(),
  isOnboarded: z.preprocess(
    (value) => {
      if (value === 'true') {
        return true;
      }
      if (value === 'false') {
        return false;
      }

      return value;
    },
    z.boolean().optional(),
  ),
  pagination: z.object({
    itemsPerPage: z.enum(ItemPerPage),
    page: z.number().min(1).default(1),
  }),
});

export class SearchUsersController extends Controller {
  constructor(private readonly searchUsersUseCase: SearchUsersUseCase) {
    super();
  }

  async handle({ query }: HttpRequest): Promise<HttpResponse> {
    const input = inputSchema.parse({
      ...query,
      pagination: {
        itemsPerPage: Number(query?.itemsPerPage) || ItemPerPage.TEN,
        page: Number(query?.page) || 1,
      },
    });

    const result = await this.searchUsersUseCase(input);

    return httpResponse.ok(result);
  }
}
