import type Koa from 'koa';
import { koaBody } from 'koa-body';
import { ErrorMiddleware } from '../middlewares/error-handler';

export const setupMiddlewares = (app: Koa): void => {
  app.use(koaBody({
    json: true,
    text: false,
    multipart: false,
    urlencoded: false,
  }));

  app.use(ErrorMiddleware());
};
