import type { ISearchUsers, SearchUsers } from '@/domain/contracts/repos/user';
import { User, type UserRole } from '@/domain/entities';

type Input = {
  id?: string
  name?: string
  email?: string
  role?: UserRole
  isOnboarded?: boolean
  pagination: {
    itemsPerPage: number
    page: number
  }
}

type Output = {
  users: {
    id: string
    name: string
    email: string
    role: UserRole
    isOnboarded: boolean
  }[]
  meta: {
    total: number
    itemsPerPage: number
    totalPages: number
    page: number
  }
}

export type SearchUsersUseCase = (input: Input) => Promise<Output>;

type Setup = (userRepo: ISearchUsers) => SearchUsersUseCase;

const transformUsersForOutput = (users: SearchUsers.Output[]): Output['users'] => {
  if (!users.length) {
    return [];
  }

  return users.map(user => {
    const userEntity = User.create({
      ...user,
      email: user.email,
    });

    return {
      id: userEntity.id,
      name: userEntity.name ?? '',
      email: userEntity.email,
      role: userEntity.role,
      isOnboarded: userEntity.isOnboarded,
    };
  });
};

export const setupSearchUsers: Setup = (userRepo) => {
  return async ({ pagination, ...input }) => {
    const result = await userRepo.searchUsers({
      ...input,
      pagination,
    });

    return {
      users: transformUsersForOutput(result.users),
      meta: result.meta,
    };
  };
};
