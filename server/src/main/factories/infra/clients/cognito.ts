import { Cognito } from '@/infra/clients/cognito';

export const makeCognitoClient = (): Cognito => {
  return new Cognito();
};
