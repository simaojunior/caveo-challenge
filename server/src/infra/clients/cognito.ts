import { createHmac } from 'node:crypto';
import {
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type {
  AddToGroup,
  DeleteUser,
  IAddToGroup,
  IDeleteUser,
  IRemoveFromGroup,
  ISignIn,
  ISignUp,
  RemoveFromGroup,
  SignIn,
  SignUp,
} from '@/domain/contracts/clients/cognito';
import { config } from '@/main/config/app-config';

export class Cognito implements
  ISignIn,
  ISignUp,
  IDeleteUser,
  IAddToGroup,
  IRemoveFromGroup {
    private readonly cognitoClient: CognitoIdentityProviderClient;

    constructor() {
      this.cognitoClient = new CognitoIdentityProviderClient();
    }

    async signIn({ email, password }: SignIn.Input): Promise<SignIn.Output> {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.aws.cognitoClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: this.getSecretHash(email),
        },
      });

      const { AuthenticationResult } = await this.cognitoClient.send(command);

      if (
        !AuthenticationResult?.AccessToken ||
        !AuthenticationResult.RefreshToken
      ) {
        throw new Error(`Cannot authenticate user: ${email}`);
      }

      return {
        accessToken: AuthenticationResult.AccessToken,
        refreshToken: AuthenticationResult.RefreshToken,
      };
    }

    async signUp(
      { email, password, internalId }: SignUp.Input,
    ): Promise<SignUp.Output> {
      const command = new SignUpCommand({
        ClientId: config.aws.cognitoClientId,
        Username: email,
        Password: password,
        SecretHash: this.getSecretHash(email),
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'custom:internalId',
            Value: internalId,
          },
        ],
      });

      const { UserSub } = await this.cognitoClient.send(command);

      if (!UserSub) {
        throw new Error(`Cannot signup user: ${email}`);
      }

      return {
        externalId: UserSub,
      };
    }

    async addToGroup(
      { username, groupName }: AddToGroup.Input,
    ): Promise<AddToGroup.Output> {
      const command = new AdminAddUserToGroupCommand({
        UserPoolId: config.aws.cognitoUserPoolId,
        Username: username,
        GroupName: groupName,
      });

      await this.cognitoClient.send(command);
    }

    async deleteUser(
      { externalId }: DeleteUser.Input,
    ): Promise<DeleteUser.Output> {
      const command = new AdminDeleteUserCommand({
        UserPoolId: config.aws.cognitoUserPoolId,
        Username: externalId,
      });

      await this.cognitoClient.send(command);
    }

    async removeFromGroup(
      { username, groupName }: RemoveFromGroup.Input,
    ): Promise<RemoveFromGroup.Output> {
      const command = new AdminRemoveUserFromGroupCommand({
        UserPoolId: config.aws.cognitoUserPoolId,
        Username: username,
        GroupName: groupName,
      });

      await this.cognitoClient.send(command);
    }

    private getSecretHash(email: string): string {
      const clientId = config.aws.cognitoClientId;
      const clientSecret = config.aws.cognitoClientSecret;

      return createHmac('SHA256', clientSecret)
        .update(`${email}${clientId}`)
        .digest('base64');
    }
}
