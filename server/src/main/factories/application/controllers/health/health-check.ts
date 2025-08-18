import { HealthCheckController } from '@/application/controllers';
import { makeHealthCheck } from '@/main/factories/domain/use-cases';

export const makeHealthCheckController = (): HealthCheckController => {
  const healthCheckUseCase = makeHealthCheck();

  return new HealthCheckController(healthCheckUseCase);
};
