export namespace AuthenticateUser {
  export type Input = {
    email: string
    password: string
  }
  export type Output = {
    accessToken: string
    refreshToken: string
  }
}

export interface IAuthenticateUser {
  authenticateUser: (
    input: AuthenticateUser.Input
  ) => Promise<AuthenticateUser.Output>
}

export namespace RegisterUser {
  export type Input = {
    email: string
    password: string
    internalId: string
  }

  export type Output = {
    externalId: string
  }
}

export interface IRegisterUser {
  registerUser: (input: RegisterUser.Input) => Promise<RegisterUser.Output>
}

export namespace AddUserToRole {
  export type Input = {
    username: string
    roleName: string
  }
  export type Output = void
}

export interface IAddUserToRole {
  addUserToRole: (input: AddUserToRole.Input) => Promise<AddUserToRole.Output>
}

export namespace RemoveUserFromRole {
  export type Input = {
    username: string
    roleName: string
  }
  export type Output = void
}

export interface IRemoveUserFromRole {
  removeUserFromRole: (
    input: RemoveUserFromRole.Input
  ) => Promise<RemoveUserFromRole.Output>
}

export namespace RemoveUser {
  export type Input = {
    userId: string
  }
  export type Output = void
}

export interface IRemoveUser {
  removeUser: (input: RemoveUser.Input) => Promise<RemoveUser.Output>
}
