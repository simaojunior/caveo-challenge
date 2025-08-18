import type { HttpRequest, HttpResponse, IMiddleware, IRequestLogger } from '@/application/contracts';
import { httpResponse } from '@/application/helpers/http';

export class RequestLoggingMiddleware implements IMiddleware {
  constructor(private readonly requestLogger: IRequestLogger) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    this.requestLogger.logStart(request);

    const startTime = Date.now();

    const enhancedRequest = {
      ...request,
      startTime,
    };

    return httpResponse.ok({
      request: enhancedRequest,
      startTime,
    });
  }

  logCompletion(
    request: HttpRequest,
    response: HttpResponse,
    startTime: number,
  ): void {
    const duration = Date.now() - startTime;
    this.requestLogger.logEnd(request, response, duration);
  }
}
