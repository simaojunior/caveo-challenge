import { InfraError } from './infra';

export class ConnectionNotFoundError extends InfraError {
  constructor() {
    super('No connection was found');
    this.name = 'ConnectionNotFoundError';
  }
}

export class TransactionNotFoundError extends InfraError {
  constructor() {
    super('No transaction was found');
    this.name = 'TransactionNotFoundError';
  }
}
