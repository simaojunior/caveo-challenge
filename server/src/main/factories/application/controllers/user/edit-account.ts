import { EditAccountController } from '@/application/controllers';
import { makeEditAccountUseCase } from '@/main/factories/domain/use-cases';

export const makeEditAccountController = (): EditAccountController => {
  return new EditAccountController(makeEditAccountUseCase());
};
