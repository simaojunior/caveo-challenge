import type Koa from 'koa';
import cors from '@koa/cors';
import helmet from 'koa-helmet';
import { koaBody } from 'koa-body';
import KoaRatelimit from 'koa-ratelimit';

import { ErrorMiddleware } from '../middlewares/error-handler';
import { makeRequestLoggingMiddleware } from '../factories/application/middlewares/request-logging';
import { config } from './app-config';
import { setupSwagger } from './swagger';

export const setupMiddlewares = (app: Koa): void => {
  const db = new Map();

  setupSwagger(app);

  app.use(ErrorMiddleware());
  app.use(helmet());
  app.use(
    KoaRatelimit({
      //TODO: Configure Redis for rate limiting in production
      driver: 'memory',
      db,
      duration: config.app.rateLimit.duration,
      max: config.app.rateLimit.max,
      throw: true,
      errorMessage: 'Too many requests. Please try again later.',
    }),
  );
  app.use(cors({ credentials: true }));
  app.use(makeRequestLoggingMiddleware());
  app.use(koaBody());
};
