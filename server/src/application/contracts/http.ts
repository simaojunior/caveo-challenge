import type * as http from 'http';
import type { UserRole } from '@/domain/entities/user';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type AuthenticatedUser = {
  id: string;
  roles: UserRole[];
  jwt?: string;
};

export type AnyObject = Record<string, unknown>;

export type HttpRequest = {
  body?: AnyObject;
  query?: AnyObject;
  params?: AnyObject;
  headers?: http.IncomingHttpHeaders;
  user?: AuthenticatedUser;
  method?: HttpMethod;
  path?: string;
};

export type HttpResponse<T = unknown> = {
  statusCode: number;
  data: T;
  type?: string;
};
