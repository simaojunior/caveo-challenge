import { ApplicationError } from './application';

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Authentication required. Please login to access this resource.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
