import { ApplicationError } from './application';

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions to access this resource.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
