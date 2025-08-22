import { z } from 'zod';

import { httpResponse } from '@/application/helpers/http';
import type { HttpResponse, IErrorHandler } from '@/application/contracts';
import { UnauthorizedError, ForbiddenError, ResourceNotFound, ApplicationError } from '@/application/errors';
import { DomainError, InsufficientPermissionsError } from '@/domain/errors';

interface IErrorStrategy {
  canHandle(error: Error): boolean;
  handle(error: Error): HttpResponse;
}

class ZodErrorStrategy implements IErrorStrategy {
  canHandle(error: Error): boolean {
    return error instanceof z.ZodError;
  }

  handle(error: Error): HttpResponse {
    const zodError = error as z.ZodError;

    const message = zodError.issues.map(issue => ({
      field: issue.path.join('.'),
      error: issue.message,
    }));

    return httpResponse.validationError(message);
  }
}

class ApplicationErrorStrategy implements IErrorStrategy {
  canHandle(error: Error): boolean {
    return error instanceof ApplicationError;
  }

  handle(error: Error): HttpResponse {
    const appError = error as ApplicationError;

    if (appError instanceof UnauthorizedError) {
      return httpResponse.unauthorized(appError);
    }

    if (appError instanceof ForbiddenError) {
      return httpResponse.forbidden(appError);
    }

    if (appError instanceof ResourceNotFound) {
      return httpResponse.notFound(appError);
    }

    return httpResponse.badRequest(appError);
  }
}

class DomainErrorStrategy implements IErrorStrategy {
  canHandle(error: Error): boolean {
    return error instanceof DomainError;
  }

  handle(error: Error): HttpResponse {
    if (error instanceof InsufficientPermissionsError) {
      return httpResponse.forbidden(error);
    }

    return httpResponse.badRequest(error);
  }
}

class DefaultErrorStrategy implements IErrorStrategy {
  canHandle(): boolean {
    return true;
  }

  handle(error: Error): HttpResponse {
    return httpResponse.serverError(error);
  }
}

export class HttpErrorHandler implements IErrorHandler {
  private strategies: IErrorStrategy[] = [
    new ZodErrorStrategy(),
    new ApplicationErrorStrategy(),
    new DomainErrorStrategy(),
    new DefaultErrorStrategy(),
  ];

  handle(error: Error): HttpResponse {
    const strategy = this.strategies.find(
      strategy => strategy.canHandle(error),
    );

    if (!strategy) {
      return httpResponse.serverError(error);
    }

    return strategy.handle(error);
  }
}
