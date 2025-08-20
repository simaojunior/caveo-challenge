import { setupHealthCheck, type HealthCheckUseCase } from '@/domain/use-cases';
import { makePgConnection } from '@/main/factories/infra/repos/helpers/connection';

export const makeHealthCheck = (): HealthCheckUseCase => {
  return setupHealthCheck(makePgConnection());
};
