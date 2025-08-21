import  { UserRepository } from '@/infra/repos/postgres/user';
import { makePgConnection } from './helpers/connection';

export const makeUserRepo = (): UserRepository => {
  return new UserRepository(makePgConnection());
};
