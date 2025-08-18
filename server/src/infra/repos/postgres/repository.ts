import { PgConnection } from '@/infra/repos/postgres/helpers/connection';
import type { ObjectType, Repository, ObjectLiteral } from 'typeorm';

export abstract class PgRepository {
  constructor(protected readonly connection: PgConnection) {}

  protected getRepository<Entity extends ObjectLiteral>(
    entity: ObjectType<Entity>,
  ): Repository<Entity> {
    return this.connection.getRepository(entity);
  }

  protected async withTransaction<T>(
    work: (connection: PgConnection) => Promise<T>,
  ): Promise<T> {
    return this.connection.withTransaction(async (manager) => {
      const transactionalConnection = new PgConnection(
        this.connection.getInstance(),
      );

      transactionalConnection.getRepository = <Entity extends ObjectLiteral>(
        entity: ObjectType<Entity>,
      ) => {
        return manager.getRepository(entity);
      };

      return await work(transactionalConnection);
    });
  }
}
