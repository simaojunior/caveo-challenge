import { makeUserRepo } from '@/main/factories/infra/repos/postgres/user';
import { setupEditAccount, type EditAccountUseCase } from '@/domain/use-cases';

export const makeEditAccountUseCase = (): EditAccountUseCase => {
  return setupEditAccount(makeUserRepo());
};
