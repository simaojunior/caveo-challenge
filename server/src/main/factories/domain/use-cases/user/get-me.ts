import { setupGetMe, type GetMeUseCase } from '@/domain/use-cases';
import { makeUserRepo } from '@/main/factories/infra/repos/postgres/user';

export const makeGetMeUseCase = (): GetMeUseCase => {
  return setupGetMe(makeUserRepo());
};
