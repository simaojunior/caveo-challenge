import type { Next } from 'koa';
import type { IAppContext } from '@/main/@types/app-context';
import type { RequestLoggingMiddleware } from '@/application/middlewares/request-logging';
import { mapKoaContextToHttpRequest } from './shared/koa-mapping';

export const adaptRequestLoggingMiddleware = (
  requestLoggingMiddleware: RequestLoggingMiddleware,
) => async (ctx: IAppContext, next: Next): Promise<void> => {
  const request = mapKoaContextToHttpRequest(ctx);
  const response = await requestLoggingMiddleware.handle(request);

  const { startTime } = response.data as { startTime: number };

  try {
    await next();

    const completionResponse = {
      statusCode: ctx.status,
      data: ctx.body,
    };

    requestLoggingMiddleware.logCompletion(
      request,
      completionResponse,
      startTime,
    );
  } catch (error) {
    const errorResponse = {
      statusCode: ctx.status || 500,
      data: ctx.body || { message: 'Internal Server Error' },
    };

    requestLoggingMiddleware.logCompletion(request, errorResponse, startTime);

    // Re-throw error to let error handler middleware handle it
    throw error;
  }
};
