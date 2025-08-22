import type {
  IMiddleware,
  HttpRequest,
  HttpResponse,
} from '@/application/contracts';
import { httpResponse } from '@/application/helpers/http';
import { UnauthorizedError } from '@/application/errors';
import type { ITokenValidator } from '@/domain/contracts/gateways/token';

export class AuthenticationMiddleware implements IMiddleware {
  constructor(private readonly tokenValidator: ITokenValidator) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
      return httpResponse.unauthorized(
        new UnauthorizedError('Missing or invalid authorization header'),
      );
    }

    const token = authHeader.toString().substring(7);

    try {
      const { internalId, roles } = await this.tokenValidator.validate({
        token,
      });

      const user = {
        id: internalId,
        roles,
        jwt: token,
      };

      request.user = user;

      return httpResponse.ok({ user });
    } catch {
      return httpResponse.unauthorized(
        new UnauthorizedError('Invalid token'),
      );
    }
  }
}
