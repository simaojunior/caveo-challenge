import { Me } from '@/application/controllers';
import { makeMeUseCase } from '@/main/factories/domain/use-cases';

export const makeMeController = (): Me => {
  return new Me(makeMeUseCase());
};
