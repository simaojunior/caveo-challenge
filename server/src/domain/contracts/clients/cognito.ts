export namespace SignIn {
  export type Input = {
    email: string
    password: string
  }
  export type Output = {
    accessToken: string
    refreshToken: string
  }
}

export interface ISignIn {
  signIn: (input: SignIn.Input) => Promise<SignIn.Output>
}

export namespace SignUp {
  export type Input = {
    email: string
    password: string
    internalId: string
  }
  export type Output = {
    externalId: string
  }
}

export interface ISignUp {
  signUp: (input: SignUp.Input) => Promise<SignUp.Output>
}

export namespace DeleteUser {
  export type Input = {
    externalId: string
  }
  export type Output = void
}

export interface IDeleteUser {
  deleteUser: (input: DeleteUser.Input) => Promise<DeleteUser.Output>
}

export namespace AddToGroup {
  export type Input = {
    username: string
    groupName: string
  }
  export type Output = void
}

export interface IAddToGroup {
  addToGroup: (input: AddToGroup.Input) => Promise<AddToGroup.Output>
}

export namespace RemoveFromGroup {
  export type Input = {
    username: string
    groupName: string
  }
  export type Output = void
}

export interface IRemoveFromGroup {
  removeFromGroup: (
    input: RemoveFromGroup.Input
  ) => Promise<RemoveFromGroup.Output>
}
