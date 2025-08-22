import type Router from '@koa/router';

import { auth, authorize } from '@/main/middlewares';
import { adaptKoaRoute as adapt } from '@/main/adapters/koa-router';
import { makeEditAccountController, makeGetMeController } from '../factories/application/controllers';

export const setupUserRoutes = (router: Router): void => {
  router.get('/me', auth, authorize, adapt(makeGetMeController()));
  router.put('/edit-account', auth, authorize, adapt(makeEditAccountController()));
};
