import Koa from 'koa';
import { setupMiddlewares } from './middlewares';
import { setupRoutes } from './routes';

export const createApp = (): Koa => {
  const app = new Koa();
  setupMiddlewares(app);
  setupRoutes(app);

  return app;
};
