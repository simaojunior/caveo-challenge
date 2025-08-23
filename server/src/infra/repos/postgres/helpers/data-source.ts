import { config } from '@/main/config/app-config';
import { DataSource } from 'typeorm';
import 'reflect-metadata';

const entitiesPath = config.isDevelopment
  ? ['src/infra/repos/postgres/entities/**/*.ts']
  : ['build/src/infra/repos/postgres/entities/**/*.js'];

const migrationsPath = config.isDevelopment
  ? ['src/infra/repos/postgres/migrations/**/*.ts']
  : ['build/src/infra/repos/postgres/migrations/**/*.js'];

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  entities: entitiesPath,
  migrations: migrationsPath,
  synchronize: config.isDevelopment,
  logging: config.isDevelopment ? ['query', 'error'] : ['error'],
  migrationsRun: true,
});
