import type Koa from 'koa';
import Router from '@koa/router';

import { setupHealthRoutes, setupAuthRoutes } from '../routes';

export const setupRoutes = (app: Koa): void => {
  const router = new Router();
  router.prefix('/v1');

  setupHealthRoutes(router);
  setupAuthRoutes(router);

  app.use(router.routes());
  app.use(router.allowedMethods());
};
