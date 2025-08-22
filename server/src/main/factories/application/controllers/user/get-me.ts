import { GetMeController } from '@/application/controllers';
import { makeGetMeUseCase } from '@/main/factories/domain/use-cases';

export const makeGetMeController = (): GetMeController => {
  return new GetMeController(makeGetMeUseCase());
};
