import { createModuleLogger } from '@/infra/shared/logging/logger';
import type { IAddCompensation, IRun, CompensationFn } from '@/domain/contracts/patterns/saga';

const logger = createModuleLogger('saga');

export class Saga implements IAddCompensation, IRun {
  private compensations: CompensationFn[] = [];

  addCompensation(fn: CompensationFn): void {
    this.compensations.unshift(fn);
  }

  async run<TResult>(fn: () => Promise<TResult>): Promise<TResult> {
    try {
      return await fn();
    } catch (error) {
      await this.compensate();

      throw error;
    }
  }

  private async compensate(): Promise<void> {
    logger.info({
      compensationCount: this.compensations.length,
    }, 'Starting compensation process');

    for (const compensation of this.compensations) {
      try {
        await compensation();
        logger.debug('Compensation step completed successfully');
      } catch (error) {
        logger.error({
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Compensation step failed');
      }
    }

    logger.info('Compensation process completed');
  }
}
