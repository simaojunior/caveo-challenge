import { JwtTokenHandler } from '@/infra/gateways/jwt-token-handler';

export const makeJwtTokenHandler = (): JwtTokenHandler => {
  return new JwtTokenHandler();
};
