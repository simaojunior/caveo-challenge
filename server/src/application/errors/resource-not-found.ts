import { ApplicationError } from './application';

export class ResourceNotFound extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'ResourceNotFound';
  }
}
