import { RequestLoggingMiddleware } from '@/application/middlewares/request-logging';
import { PinoRequestLogger } from '@/infra/shared/logging/request-logger';
import { adaptRequestLoggingMiddleware } from '../../../adapters/koa-request-logging';

export const makeRequestLoggingMiddleware = () => {
  const requestLogger = new PinoRequestLogger();

  const requestLoggingMiddleware = new RequestLoggingMiddleware(requestLogger);

  return adaptRequestLoggingMiddleware(requestLoggingMiddleware);
};
