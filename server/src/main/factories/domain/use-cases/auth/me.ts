import { setupMe, type MeUseCase } from '@/domain/use-cases';
import { makeUserRepo } from '@/main/factories/infra/repos/postgres/user';

export const makeMeUseCase = (): MeUseCase => {
  return setupMe(makeUserRepo());
};
