import type { Next, ParameterizedContext } from 'koa';

import { createModuleLogger } from '@/infra/shared/logging/logger';
import { makeErrorHandler } from '../factories/application/middlewares/error-handler';

const logger = createModuleLogger('error-middleware');

export const ErrorMiddleware = () => {
  const errorHandler = makeErrorHandler();

  return async (ctx: ParameterizedContext, next: Next) => {
    try {
      await next();
    } catch (error) {
      const httpResponse = errorHandler.handle(error as Error);

      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: httpResponse.statusCode,
        path: ctx.path,
        method: ctx.method,
      }, 'Request failed with error');

      ctx.status = httpResponse.statusCode;
      ctx.body = httpResponse.data;
    }
  };
};
