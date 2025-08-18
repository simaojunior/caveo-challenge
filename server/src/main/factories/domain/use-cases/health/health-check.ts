import { setupHealthCheck, type HealthCheckUseCase } from '@/domain/use-cases';

export const makeHealthCheck = (): HealthCheckUseCase => {
  return setupHealthCheck();
};
