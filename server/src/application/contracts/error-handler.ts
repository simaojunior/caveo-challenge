import type { HttpResponse } from './http';

export interface IErrorHandler {
  handle(error: Error): HttpResponse;
}
