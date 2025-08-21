import type { UserRole } from '@/domain/entities/user';

export interface ICreateUser {
  createUser: (input: CreateUser.Input) => Promise<void>;
}

export namespace CreateUser {
  export type Input = {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
    isOnboarded: boolean;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  };
}

export interface IUpdateUser {
  updateUser: (input: UpdateUser.Input) => Promise<void>;
}

export namespace UpdateUser {
  export type Input = {
    id: string;
    name?: string;
    email?: string;
    isOnboarded?: boolean;
    updatedAt?: Date;
  };
}

export interface IFindUser {
  findUser: (input: FindUser.Input) => Promise<FindUser.Output | null>;
}

export namespace FindUser {
  export type Input = {
    id: string;
  };

  export type Output = {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
    isOnboarded: boolean;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  };
}

export interface IFindUserByEmail {
  findUserByEmail: (
    input: FindUserByEmail.Input
  ) => Promise<FindUserByEmail.Output | null>;
}

export namespace FindUserByEmail {
  export type Input = {
    email: string;
  };

  export type Output = {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
    isOnboarded: boolean;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }
}

export interface IFindUserByExternalId {
  findUserByExternalId: (
    input: FindUserByExternalId.Input
  ) => Promise<FindUserByExternalId.Output | null>;
}

export namespace FindUserByExternalId {
  export type Input = {
    externalId: string;
  };

  export type Output = {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
    isOnboarded: boolean;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  };
}

export interface ISearchUsers {
  searchUsers: (input: SearchUsers.Input) => Promise<SearchUsers.Output>;
}

export namespace SearchUsers {
  export type Input = {
    name?: string;
    email?: string;
    role?: UserRole;
    isOnboarded?: boolean;
    pagination: {
      itemsPerPage: number;
      page: number;
    };
  };

  export type Output = {
    users: {
      id: string;
      name?: string;
      email: string;
      role: UserRole;
      isOnboarded: boolean;
      createdAt: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
    }[];
    totalCount: number;
  };
}
