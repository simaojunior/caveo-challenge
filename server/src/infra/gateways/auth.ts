import type {
  AddUserToRole,
  AuthenticateUser,
  IAddUserToRole,
  IAuthenticateUser,
  IRegisterUser,
  IRemoveUser,
  IRemoveUserFromRole,
  RegisterUser,
  RemoveUser,
  RemoveUserFromRole,
} from '@/domain/contracts/gateways/auth';
import type {
  IAddToGroup,
  IDeleteUser,
  IRemoveFromGroup,
  ISignIn,
  ISignUp,
} from '@/domain/contracts/clients/cognito';

export class AuthGateway implements
  IAuthenticateUser,
  IRegisterUser,
  IAddUserToRole,
  IRemoveUserFromRole,
  IRemoveUser {
  constructor(
    private readonly cognitoClient: ISignIn & ISignUp & IDeleteUser &
      IAddToGroup & IRemoveFromGroup,
  ) {}

  async authenticateUser({
    email,
    password,
  }: AuthenticateUser.Input): Promise<AuthenticateUser.Output> {
    const {
      accessToken,
      refreshToken,
    } = await this.cognitoClient.signIn({ email, password });

    return {
      accessToken,
      refreshToken,
    };
  }

  async registerUser({
    email,
    password,
    internalId,
  }: RegisterUser.Input): Promise<RegisterUser.Output> {
    const { externalId } = await this.cognitoClient.signUp({
      email,
      password,
      internalId,
    });

    return {
      externalId,
    };
  }

  async removeUser({
    userId,
  }: RemoveUser.Input): Promise<RemoveUser.Output> {
    await this.cognitoClient.deleteUser({ externalId: userId });
  }

  // Role Management methods
  async addUserToRole(
    { username, roleName }: AddUserToRole.Input,
  ): Promise<AddUserToRole.Output> {
    await this.cognitoClient.addToGroup({ username, groupName: roleName });
  }

  async removeUserFromRole(
    { username, roleName }: RemoveUserFromRole.Input,
  ): Promise<RemoveUserFromRole.Output> {
    await this.cognitoClient.removeFromGroup({ username, groupName: roleName });
  }
}
