import type { HttpRequest, AnyObject } from '@/application/contracts';
import type { IAppContext } from '@/main/@types/app-context';

/**
 * Maps Koa context to HttpRequest format
 * Centralizes the request mapping logic to avoid duplication across adapters
 */
export const mapKoaContextToHttpRequest = <T extends AnyObject = AnyObject>(
  ctx: IAppContext<T>,
): HttpRequest => ({
    body: ctx.request.body,
    query: ctx.query,
    params: ctx.params,
    headers: ctx.headers,
    method: ctx.method as HttpRequest['method'],
    path: ctx.path,
    user: ctx.state.user ? {
      id: ctx.state.user.id,
      roles: ctx.state.user.roles || [],
      jwt: ctx.state.user.jwt,
    } : undefined,
  });

/**
 * Maps HttpResponse to Koa context
 * Centralizes the response mapping logic
 */
export const mapHttpResponseToKoaContext = <T = unknown>(
  ctx: IAppContext<T>,
  response: { statusCode: number; data: unknown; type?: string },
): void => {
  ctx.status = response.statusCode;
  ctx.body = response.data;

  if (response.type) {
    ctx.type = response.type;
  }
};
