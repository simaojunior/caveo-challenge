import type { HttpRequest, HttpResponse } from './http';

export interface IMiddleware {
  handle(request: HttpRequest): Promise<HttpResponse>;
}
