import type Koa from 'koa';
import Router from '@koa/router';

import { setupHealthRoutes, setupAuthRoutes, setupUserRoutes } from '../routes';

export const setupRoutes = (app: Koa): void => {
  const router = new Router();
  router.prefix('/v1');

  setupHealthRoutes(router);
  setupAuthRoutes(router);
  setupUserRoutes(router);

  app.use(router.routes());
  app.use(router.allowedMethods());
};
