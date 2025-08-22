import { jwtVerify, createRemoteJWKSet } from 'jose';

import { config } from '@/main/config/app-config';
import type { UserRole } from '@/domain/entities/user';
import type { ITokenValidator, TokenValidator } from '@/domain/contracts/gateways/token';
// {
//   "sub": "54b834c8-3081-70cf-624e-ce6c89ff3db2",
//   "cognito:groups": [
//     "user"
//   ],
//   "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_SIyTab38w",
//   "client_id": "16mg0ladk97gk98l622ngu2tgm",
//   "origin_jti": "c332d14b-3c77-4200-b321-0f5a2fa4a613",
//   "internalId": "af5611e2-7a21-40ed-b1a6-a26e79cc09b3",
//   "event_id": "66f7c2eb-67a7-408e-bad2-84a11f6a9436",
//   "token_use": "access",
//   "scope": "aws.cognito.signin.user.admin",
//   "auth_time": 1755814643,
//   "exp": 1755857843,
//   "iat": 1755814643,
//   "jti": "868fb4f4-b8b1-4447-a2de-d4a271c161c9",
//   "username": "54b834c8-3081-70cf-624e-ce6c89ff3db2"
// }
export class JwtTokenHandler implements ITokenValidator {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor() {}

  async validate(
    { token }: TokenValidator.Input,
  ): Promise<TokenValidator.Output> {
    try {
      if (!this.jwks) {
        this.jwks = createRemoteJWKSet(new URL(config.aws.cognitoJwksUri));
      }

      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: config.auth.jwtExpectedIssuer,
      });

      return {
        internalId: payload.internalId as string,
        roles: payload['cognito:groups'] as UserRole[],
      };
    } catch {
      throw new Error('Invalid token');
    }
  }
}
