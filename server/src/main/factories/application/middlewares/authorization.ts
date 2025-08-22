import type { UserRole } from '@/domain/entities/user';
import type { IMiddleware } from '@/application/contracts';
import { AuthorizationMiddleware } from '@/application/middlewares/authorization';

export const makeAuthorizationMiddleware = (
  requiredRoles: UserRole[] = [],
): IMiddleware => {
  return new AuthorizationMiddleware(requiredRoles);
};
