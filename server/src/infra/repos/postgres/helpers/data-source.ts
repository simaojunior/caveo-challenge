import { config } from '@/main/config/app-config';
import { DataSource } from 'typeorm';
import 'reflect-metadata';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  entities: ['src/infra/repos/postgres/entities/**/*.ts'],
  migrations: ['src/infra/repos/postgres/migrations/**/*.ts'],
  synchronize: config.isDevelopment,
  logging: config.isDevelopment ? ['query', 'error'] : ['error'],
  migrationsRun: true,
});
