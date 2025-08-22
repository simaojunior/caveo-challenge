import { httpResponse } from '../helpers/http';
import type { UserRole } from '@/domain/entities/user';
import { ForbiddenError, UnauthorizedError } from '../errors';
import type { HttpRequest, HttpResponse, IMiddleware } from '../contracts';

export class AuthorizationMiddleware implements IMiddleware {
  constructor(private readonly requiredRoles: UserRole[]) {}

  async handle(
    request: HttpRequest,
  ): Promise<HttpResponse> {
    if (!request.user) {
      return httpResponse.unauthorized(
        new UnauthorizedError('User not authenticated'),
      );
    }
    const userRoles = request.user.roles || [];
    const hasRequiredRole = this.requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      const errorMessage = `Insufficient permissions. Missing roles: ${this.requiredRoles.join(', ')}`;

      return httpResponse.forbidden(
        new ForbiddenError(errorMessage),
      );
    }

    return httpResponse.ok(null);
  }
}
