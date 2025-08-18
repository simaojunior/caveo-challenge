import { createApp } from './config/app';
import { config } from './config/app-config';
import { serverLogger } from '@/infra/shared/logging/logger';
import { PgConnection, AppDataSource } from '@/infra/repos/postgres/helpers';

function main() {
  const app = createApp();
  const port = config.app.port;
  const pgConnection = new PgConnection(AppDataSource);

  if (!pgConnection.isInitialized()) {
    pgConnection.initialize();
    serverLogger.info('Database connection initialized');
  }

  app.listen(port, () => {
    serverLogger.info(`Server is running on http://localhost:${port}`);
  });
}

main();

process.on('unhandledRejection', (error) => {
  serverLogger.error(error, 'Unhandled Rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  serverLogger.error(error, 'Uncaught Exception');
  process.exit(1);
});
