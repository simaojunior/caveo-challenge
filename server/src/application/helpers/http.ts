import { config } from '@/main/config/app-config';
import type { HttpResponse as HttpResponseData } from '../contracts/http';
import { ErrorCode } from './error-code';

export const httpResponse = {
  ok: <T = unknown>(data: T): HttpResponseData<T> => ({
    statusCode: 200,
    data,
  }),

  created: <T = unknown>(data: T): HttpResponseData<T> => ({
    statusCode: 201,
    data,
  }),

  redirect: (url: string): HttpResponseData<string> => ({
    statusCode: 301,
    data: url,
  }),

  conflict: ({ message }: Error): HttpResponseData => ({
    statusCode: 409,
    data: {
      name: ErrorCode.CONFLICT,
      message,
    },
  }),

  validationError: (
    message: { field: string; error: string }[],
  ): HttpResponseData => ({
    statusCode: 400,
    data: {
      name: ErrorCode.VALIDATION,
      message,
    },
  }),

  badRequest: ({ message }: Error): HttpResponseData => ({
    statusCode: 400,
    data: {
      name: ErrorCode.BAD_REQUEST,
      message,
    },
  }),

  noContent: (): HttpResponseData => ({
    statusCode: 204,
    data: null,
  }),

  notFound: ({ message }: Error): HttpResponseData => ({
    statusCode: 404,
    data: {
      name: ErrorCode.RESOURCE_NOT_FOUND,
      message,
    },
  }),

  unauthorized: ({ message }: Error): HttpResponseData => ({
    statusCode: 401,
    data: {
      name: ErrorCode.UNAUTHORIZED,
      message,
    },
  }),

  tooManyRequests: ({ message }: Error): HttpResponseData => ({
    statusCode: 429,
    data: {
      name: ErrorCode.TOO_MANY_REQUESTS,
      message,
    },
  }),

  forbidden: ({ message }: Error): HttpResponseData => ({
    statusCode: 403,
    data: {
      name: ErrorCode.FORBIDDEN,
      message,
    },
  }),

  serverError: ({ message, stack }: Error): HttpResponseData => {
    const isProduction = config.app.nodeEnv === 'production';

    return {
      statusCode: 500,
      data: {
        name: ErrorCode.SERVER_ERROR,
        message: message ?? 'Server failed. Try again soon',
        stack: isProduction ? undefined : stack,
      },
    };
  },
};
