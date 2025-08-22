import type { UserRole } from '@/domain/entities/user';

export interface ITokenValidator {
  validate: (input: TokenValidator.Input) => Promise<TokenValidator.Output>
}

export namespace TokenValidator {
  export type Input = { token: string }
  export type Output = {
    internalId: string
    roles: UserRole[]
  }
}
