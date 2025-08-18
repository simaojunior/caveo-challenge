import { Controller, type HttpResponse } from '@/application/contracts';
import { httpResponse } from '@/application/helpers/http';
import type { HealthCheckUseCase } from '@/domain/use-cases';

export class HealthCheckController extends Controller {
  constructor(private readonly healthCheckUseCase: HealthCheckUseCase) {
    super();
  }

  async handle(): Promise<HttpResponse> {
    const {
      status,
      uptime,
      timestamp,
      database,
    } = await this.healthCheckUseCase();

    return httpResponse.ok({
      status,
      uptime,
      timestamp,
      database,
    });
  }
}
