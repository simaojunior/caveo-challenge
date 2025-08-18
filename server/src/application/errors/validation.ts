import { ApplicationError } from './application';

export class ValidationError extends ApplicationError {
  public errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
