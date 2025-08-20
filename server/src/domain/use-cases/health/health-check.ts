import type { PgConnection } from '@/infra/repos/postgres/helpers';

export enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

type Output = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  database?: {
    status: 'UP' | 'DOWN';
  };
};

export type HealthCheckUseCase = () => Promise<Output>;

type Setup = (connection: PgConnection) => HealthCheckUseCase;

export const setupHealthCheck: Setup = (connection) => {
  return async (): Promise<Output> => {
    const baseHealth: Output = {
      status: HealthStatus.UP,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };

    if (connection) {
      try {
        const dataSource = connection.getInstance();
        await dataSource.query('SELECT 1');

        baseHealth.database = { status: 'UP' };
      } catch {
        baseHealth.database = { status: 'DOWN' };
        baseHealth.status = HealthStatus.DOWN;
      }
    }

    return baseHealth;
  };
};
