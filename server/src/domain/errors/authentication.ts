import { DomainError } from './domain';

export class AuthenticationError extends DomainError {
  constructor(message: string = 'Invalid authentication credentials') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
