import type Router from '@koa/router';

import { adaptKoaRoute as adapt } from '@/main/adapters/koa-router';
import { makeHealthCheckController } from '../factories/application/controllers';

export const setupHealthRoutes = (router: Router): void => {
  router.get('/v1/health', adapt(makeHealthCheckController()));
};
