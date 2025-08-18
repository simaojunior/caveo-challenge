import type { Logger } from 'pino';
import type { HttpRequest, HttpResponse, IRequestLogger } from '@/application/contracts';
import { createModuleLogger } from './logger';

export class PinoRequestLogger implements IRequestLogger {
  private readonly logger: Logger;

  constructor(module = 'request') {
    this.logger = createModuleLogger(module);
  }

  logStart(request: HttpRequest): void {
    this.logger.info({
      method: request.method,
      path: request.path,
      userAgent: request.headers?.['user-agent'],
      ip: request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip'],
    }, 'Request started');
  }

  logEnd(request: HttpRequest, response: HttpResponse, duration: number): void {
    const logLevel = this.determineLogLevel(response.statusCode);

    const logData = {
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      userAgent: request.headers?.['user-agent'],
      ip: request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip'],
    };

    const logMethods = {
      error: { method: this.logger.error.bind(this.logger), message: 'Request completed with error' },
      warn: { method: this.logger.warn.bind(this.logger), message: 'Request completed with warning' },
      info: { method: this.logger.info.bind(this.logger), message: 'Request completed' },
    } as const;

    const { method, message } = logMethods[logLevel];
    method(logData, message);
  }

  private determineLogLevel(statusCode: number): 'info' | 'warn' | 'error' {
    if (statusCode >= 500) {
      return 'error';
    }
    if (statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  }
}
