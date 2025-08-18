import os from 'node:os';
import pino from 'pino';

import { config } from '@/main/config/app-config';

export const createLogger = () => {

  const baseConfig = {
    name: config.logging.appName,
    base: {
      pid: process.pid,
      hostname: os.hostname(),
      env: config.logging.environment,
    },
    level: config.logging.level,
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
  };

  // Production configuration
  if (config.isProduction) {
    return {
      ...baseConfig,
      serializers: pino.stdSerializers,
    };
  }

  return {
    ...baseConfig,
    transport: {
      target: 'pino-pretty',
      options: {
        sync: true,
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname,env,module',
        messageFormat: '{module} {msg}',
      },
    },
  };
};
const options = createLogger();

export const logger = pino(options);

export const createModuleLogger = (module: string) => {
  return logger.child({ module: `[${module.toUpperCase()}]` });
};

export const serverLogger = createModuleLogger('server');
