import type Router from '@koa/router';
import { adaptKoaRoute as adapt } from '@/main/adapters/koa-router';
import { auth, authorize } from '@/main/middlewares';
import { makeSigninOrRegisterController, makeMeController } from '../factories/application/controllers';

export const setupAuthRoutes = (router: Router): void => {
  router.post('/auth', adapt(makeSigninOrRegisterController()));
  router.get('/me', auth, authorize, adapt(makeMeController()));
};
