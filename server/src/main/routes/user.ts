import type Router from '@koa/router';
import { adaptKoaRoute as adapt } from '@/main/adapters/koa-router';
import { makeSigninOrRegisterController } from '../factories/application/controllers';

export const setupUserRoutes = (router: Router): void => {
  router.post('/v1/auth', adapt(makeSigninOrRegisterController()));
};
