import type { HttpRequest, HttpResponse } from './http';

export interface IRequestLogger {
  logStart(request: HttpRequest): void;
  logEnd(request: HttpRequest, response: HttpResponse, duration: number): void;
}

export interface IRequestLoggingMiddleware {
  handle(request: HttpRequest): Promise<HttpResponse>;
}
