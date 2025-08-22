import { adaptKoaMiddleware } from '@/main/adapters/koa-middleware';
import { makeAuthenticationMiddleware } from '@/main/factories/application/middlewares/authentication';

export const auth = adaptKoaMiddleware(makeAuthenticationMiddleware());
