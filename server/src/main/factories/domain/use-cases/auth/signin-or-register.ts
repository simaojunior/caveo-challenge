import { makeSaga } from '../../patterns/saga';
import { makeAuthGateway } from '@/main/factories/infra/gateways/auth';
import { makeUserRepo } from '@/main/factories/infra/repos/postgres/user';
import { setupSigninOrRegister, type SigninOrRegisterUseCase } from '@/domain/use-cases';

export const makeSigninOrRegisterUseCase = (): SigninOrRegisterUseCase => {
  return setupSigninOrRegister(makeUserRepo(), makeAuthGateway(), makeSaga());
};
