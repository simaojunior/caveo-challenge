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

type Setup = () => HealthCheckUseCase;

export const setupHealthCheck: Setup = () => {

  return async (): Promise<Output> => {
    const baseHealth: Output = {
      status: HealthStatus.UP,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };

    return baseHealth;
  };
};
