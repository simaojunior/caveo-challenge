import type { UserRole } from '@/domain/entities/user';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type HttpHeaders = Record<string, string | string[] | undefined>;

export type AuthenticatedUser = {
  id: string;
  roles: UserRole[];
  jwt?: string;
};

export type HttpRequest = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
  headers?: HttpHeaders;
  user?: AuthenticatedUser;
  method?: HttpMethod;
  path?: string;
};

export type HttpResponse<T = unknown> = {
  statusCode: number;
  data: T;
  type?: string;
};
