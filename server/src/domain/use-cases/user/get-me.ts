import type { UserRole } from '@/domain/entities/user';
import { ResourceNotFound } from '@/application/errors';
import type { IFindUser } from '@/domain/contracts/repos/user';

type Input = {
  id: string;
  roles: UserRole[];
}

type Output = {
  id: string
  name?: string
  email: string
  role: UserRole
  isOnboarded: boolean
}

export type GetMeUseCase = (input: Input) => Promise<Output>;

type Setup = (userRepo: IFindUser) => GetMeUseCase;

export const setupGetMe: Setup = (userRepo) => {
  return async ({ id }) => {
    const user = await userRepo.findUser({ id });

    if (!user) {
      throw new ResourceNotFound(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
    };
  };
};
