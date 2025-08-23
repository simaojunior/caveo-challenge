import { setupSearchUsers, type SearchUsersUseCase } from '@/domain/use-cases';
import { makeUserRepo } from '@/main/factories/infra/repos/postgres/user';

export const makeSearchUsersUseCase = (): SearchUsersUseCase => {
  return setupSearchUsers(makeUserRepo());
};
