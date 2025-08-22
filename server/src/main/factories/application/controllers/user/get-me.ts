import { GetMe } from '@/application/controllers';
import { makeGetMeUseCase } from '@/main/factories/domain/use-cases';

export const makeGetMeController = (): GetMe => {
  return new GetMe(makeGetMeUseCase());
};
