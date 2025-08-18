import type { DataSource, ObjectType, QueryRunner, Repository, EntityManager, ObjectLiteral } from 'typeorm';
import { createModuleLogger } from '@/infra/shared/logging/logger';
import { ConnectionNotFoundError } from '@/infra/errors/connection';

const logger = createModuleLogger('pg-connection');

export interface IDbTransaction {
  openTransaction: () => Promise<void>;
  closeTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  getRepository: <Entity extends ObjectLiteral>(
    entity: ObjectType<Entity>
  ) => Repository<Entity>;
}

export class PgConnection implements IDbTransaction {
  private queryRunner?: QueryRunner;

  constructor(private readonly dataSource: DataSource) {}

  getInstance(): DataSource {
    if (!this.dataSource.isInitialized) {
      throw new ConnectionNotFoundError();
    }

    return this.dataSource;
  }

  async initialize(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      logger.info('[DATABASE] Initializing database connection...');
      await this.dataSource.initialize();
      logger.info('[DATABASE] Database connection established successfully');
    }
  }

  async destroy(): Promise<void> {
    if (this.dataSource.isInitialized) {
      logger.info('[DATABASE] Closing database connection...');
      await this.dataSource.destroy();
      logger.info('[DATABASE] Database connection closed');
    }
  }

  isInitialized(): boolean {
    return this.dataSource.isInitialized;
  }

  async openTransaction(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      throw new Error('Database connection not initialized');
    }

    if (this.queryRunner) {
      throw new Error('Transaction already open');
    }

    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();

    logger.debug('Database transaction opened');
  }

  async closeTransaction(): Promise<void> {
    if (!this.queryRunner) {
      return;
    }

    await this.queryRunner.release();
    this.queryRunner = undefined;

    logger.debug('Database transaction closed');
  }

  async commit(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No active transaction to commit');
    }

    await this.queryRunner.commitTransaction();
    logger.debug('Database transaction committed');
  }

  async rollback(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No active transaction to rollback');
    }

    await this.queryRunner.rollbackTransaction();
    logger.debug('Database transaction rolled back');
  }

  getQueryRunner(): QueryRunner | undefined {
    return this.queryRunner;
  }

  getRepository<Entity extends ObjectLiteral>(
    entity: ObjectType<Entity>,
  ): Repository<Entity> {
    if (!this.dataSource.isInitialized) {
      throw new ConnectionNotFoundError();
    }

    if (this.queryRunner) {
      return this.queryRunner.manager.getRepository(entity);
    }

    return this.dataSource.getRepository(entity);
  }

  async withTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      logger.debug('Transaction started');

      const result = await work(queryRunner.manager);

      await queryRunner.commitTransaction();
      logger.debug('Transaction committed');

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.debug('Transaction rolled back');

      throw error;
    } finally {
      await queryRunner.release();
      logger.debug('Query runner released');
    }
  }
}
