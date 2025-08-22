import { SigninOrRegisterController } from '@/application/controllers';
import { makeSigninOrRegisterUseCase } from '@/main/factories/domain/use-cases';

export const makeSigninOrRegisterController =
  (): SigninOrRegisterController => {
    return new SigninOrRegisterController(makeSigninOrRegisterUseCase());
  };
