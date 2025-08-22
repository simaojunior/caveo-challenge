import { DomainError } from '@/domain/errors/domain';

export class InsufficientPermissionsError extends DomainError {
  constructor(message: string = 'You do not have permission to modify user role') {
    super(message);
    this.name = 'InsufficientPermissionsError';
  }
}
