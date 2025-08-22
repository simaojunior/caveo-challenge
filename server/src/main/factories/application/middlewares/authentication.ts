import  { AuthenticationMiddleware } from '@/application/middlewares/authentication';
import { makeJwtTokenHandler } from '@/main/factories/infra/gateways/token-handler';

export const makeAuthenticationMiddleware = (): AuthenticationMiddleware => {
  const jwt = makeJwtTokenHandler();

  return new AuthenticationMiddleware(jwt);
};
