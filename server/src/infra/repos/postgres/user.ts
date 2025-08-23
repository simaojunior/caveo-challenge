import { PgRepository } from './repository';
import { User } from '@/infra/repos/postgres/entities/user';
import type {
  CreateUser,
  IUpdateUser,
  ICreateUser,
  IFindUserByEmail,
  FindUserByEmail,
  IFindUser,
  ISearchUsers,
  FindUser,
  SearchUsers,
  IFindUserByExternalId,
  FindUserByExternalId,
  UpdateUser,
} from '@/domain/contracts/repos/user';
import type { PgConnection } from './helpers/connection';

export class UserRepository
  extends PgRepository
  implements
  ICreateUser,
  IUpdateUser,
  IFindUserByEmail,
  IFindUserByExternalId,
  IFindUser,
  ISearchUsers {
  constructor(repository: PgConnection) {
    super(repository);
  }

  async createUser(input: CreateUser.Input): Promise<void> {
    const repository = this.getRepository(User);

    const user = repository.create(input);
    await repository.save(user);
  }

  async updateUser(input: UpdateUser.Input): Promise<void> {
    const repository = this.getRepository(User);

    await repository.update(input.id, input);
  }

  async findUserByEmail(
    input: FindUserByEmail.Input,
  ): Promise<FindUserByEmail.Output | null> {
    const { email } = input;

    const repository = this.getRepository(User);
    const user = await repository.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  async findUser({ id }: FindUser.Input): Promise<FindUser.Output | null> {
    const repository = this.getRepository(User);

    const user = await repository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  async findUserByExternalId(
    { externalId }: FindUserByExternalId.Input,
  ): Promise<FindUserByExternalId.Output | null> {
    const repository = this.getRepository(User);

    const user = await repository.findOne({
      where: { externalId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  async searchUsers(input: SearchUsers.Input): Promise<SearchUsers.Result> {
    const { name, email, role, isOnboarded, pagination } = input;

    const repository = this.getRepository(User);

    const [users, total] = await repository.findAndCount({
      where: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(isOnboarded !== undefined && { isOnboarded }),
      },
      take: pagination.itemsPerPage,
      skip: pagination.itemsPerPage * (pagination.page - 1),
    });

    const totalPages = Math.ceil(total / pagination.itemsPerPage);

    return {
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      })),
      meta: {
        total,
        itemsPerPage: pagination.itemsPerPage,
        totalPages,
        page: pagination.page,
      },
    };
  }
}
