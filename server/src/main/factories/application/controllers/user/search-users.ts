import { SearchUsersController } from '@/application/controllers';
import { makeSearchUsersUseCase } from '@/main/factories/domain/use-cases';

export const makeSearchUsersController = (): SearchUsersController => {
  return new SearchUsersController(makeSearchUsersUseCase());
};
