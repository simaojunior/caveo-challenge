import { SigninOrRegister } from '@/application/controllers';
import { makeSigninOrRegisterUseCase } from '@/main/factories/domain/use-cases';

export const makeSigninOrRegisterController = (): SigninOrRegister => {
  return new SigninOrRegister(makeSigninOrRegisterUseCase());
};
