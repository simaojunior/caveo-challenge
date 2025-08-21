import { AppDataSource, PgConnection } from '@/infra/repos/postgres/helpers';

export const makePgConnection = (): PgConnection => {
  return new PgConnection(AppDataSource);
};
