import { AuthGateway } from '@/infra/gateways/auth';
import { makeCognitoClient } from '@/main/factories/infra/clients/cognito';

export const makeAuthGateway = (): AuthGateway => {
  return new AuthGateway(makeCognitoClient());
};
