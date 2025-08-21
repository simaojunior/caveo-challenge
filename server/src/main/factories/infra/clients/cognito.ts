import { Cognito } from '@/infra/clients/cognito';
import { config } from '@/main/config/app-config';

export const makeCognitoClient = (): Cognito => {
  return new Cognito(config);
};
