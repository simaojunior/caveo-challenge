import Koa from 'koa';
import { setupMiddlewares } from './middlewares';

export const createApp = (): Koa => {
  const app = new Koa();
  setupMiddlewares(app);

  return app;
};
