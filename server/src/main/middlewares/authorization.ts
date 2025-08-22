import { adaptKoaMiddleware } from '@/main/adapters/koa-middleware';
import { makeAuthorizationMiddleware } from '@/main/factories/application/middlewares/authorization';

export const authorizeUser = adaptKoaMiddleware(
  makeAuthorizationMiddleware(['user']),
);

export const authorizeAdmin = adaptKoaMiddleware(
  makeAuthorizationMiddleware(['admin']),
);

export const authorize = adaptKoaMiddleware(
  makeAuthorizationMiddleware(['user', 'admin']),
);
