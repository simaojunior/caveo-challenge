import { User, type UserRole } from '@/domain/entities/user';
import type { ICreateUser, IFindUserByEmail } from '@/domain/contracts/repos/user';
import type {
  IAddUserToRole,
  IAuthenticateUser,
  IRegisterUser,
  IRemoveUser,
} from '@/domain/contracts/gateways/auth';
import type { IAddCompensation, IRun } from '@/domain/contracts/patterns/saga';

type Input = {
  email: string;
  password: string;
  role?: UserRole;
  name?: string;
};

type Output = {
  accessToken: string;
  refreshToken: string;
  isOnboarded: boolean;
};

export type SigninOrRegisterUseCase = (input: Input) => Promise<Output>;

type Setup = (
  userRepo: IFindUserByEmail & ICreateUser,
  authGateway: IAuthenticateUser & IRegisterUser & IAddUserToRole & IRemoveUser,
  saga: IAddCompensation & IRun
) => SigninOrRegisterUseCase;

export const setupSigninOrRegister: Setup = (
  userRepo,
  authGateway,
  saga,
) => {
  return async (input) => {
    const { email, password, role, name } = input;

    const existingUser = await userRepo.findUserByEmail({ email });

    if (existingUser) {
      const {
        accessToken,
        refreshToken,
      } = await authGateway.authenticateUser({ email, password });

      return {
        isOnboarded: existingUser.isOnboarded,
        accessToken,
        refreshToken,
      };
    }

    const user = await saga.run(async () => {
      const user = User.create({
        email,
        role,
        name,
      });

      const { externalId } = await authGateway.registerUser({
        email,
        password,
        internalId: user.id,
      });

      saga.addCompensation(async () => {
        await authGateway.removeUser({ userId: externalId });
      });

      user.setExternalId(externalId);

      await authGateway.addUserToRole({
        username: email,
        roleName: user.role,
      });

      await userRepo.createUser(user);

      return user;
    });

    const {
      accessToken,
      refreshToken,
    } = await authGateway.authenticateUser({ email, password });

    return {
      isOnboarded: user.isOnboarded,
      accessToken,
      refreshToken,
    };
  };
};
