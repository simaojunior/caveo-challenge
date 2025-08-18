import type { IMiddleware } from '@/application/contracts';
import type { IAppContext } from '@/main/@types/app-context';
import type { Next } from 'koa';
import { mapKoaContextToHttpRequest } from './shared/koa-mapping';

type MiddlewareAdapter = (middleware: IMiddleware) =>
  (ctx: IAppContext, next: Next) => Promise<void>;

export const adaptKoaMiddleware: MiddlewareAdapter = (middleware) =>
  async (ctx, next) => {
    const request = mapKoaContextToHttpRequest(ctx);
    const response = await middleware.handle(request);

    if (response.statusCode === 200) {
      if (response.data && typeof response.data === 'object') {
        Object.assign(ctx.state, response.data);
      }
      await next();
    } else {
      ctx.status = response.statusCode;
      ctx.body = response.data;
    }
  };

