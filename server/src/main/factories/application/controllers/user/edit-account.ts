import { EditAccount } from '@/application/controllers';
import { makeEditAccountUseCase } from '@/main/factories/domain/use-cases';

export const makeEditAccountController = (): EditAccount => {
  return new EditAccount(makeEditAccountUseCase());
};
