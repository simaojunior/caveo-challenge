import { config } from './config/app-config';
import { createApp } from './config/app';

import { serverLogger } from '@/infra/shared/logging/logger';

function main() {
  const app = createApp();

  const port = config.app.port;
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
