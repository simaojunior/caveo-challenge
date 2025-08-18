import type Koa from 'koa';
import { koaBody } from 'koa-body';
import { ErrorMiddleware } from '../middlewares/error-handler';
import { makeRequestLoggingMiddleware } from '../factories/application/middlewares/request-logging';

export const setupMiddlewares = (app: Koa): void => {
  app.use(makeRequestLoggingMiddleware());

  app.use(koaBody({
    json: true,
    text: false,
    multipart: false,
    urlencoded: false,
  }));

  app.use(ErrorMiddleware());
};
