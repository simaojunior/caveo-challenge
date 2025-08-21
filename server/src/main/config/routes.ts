import type Koa from 'koa';
import Router from '@koa/router';

import { setupHealthRoutes, setupUserRoutes } from '../routes';

export const setupRoutes = (app: Koa): void => {
  const router = new Router();

  setupHealthRoutes(router);
  setupUserRoutes(router);
  app.use(router.routes());
  app.use(router.allowedMethods());
};
