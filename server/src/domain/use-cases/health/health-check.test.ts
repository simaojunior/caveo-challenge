import { faker } from '@faker-js/faker';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupHealthCheck, HealthStatus } from './health-check';
import type { PgConnection } from '@/infra/repos/postgres/helpers';

describe('HealthCheck UseCase', () => {
  let mockConnection: PgConnection;
  let mockDataSource: {
    query: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDataSource = {
      query: vi.fn(),
    };

    mockConnection = {
      getInstance: vi.fn().mockReturnValue(mockDataSource),
    } as unknown as PgConnection;

    vi.spyOn(process, 'uptime').mockReturnValue(faker.number.int({ min: 100, max: 10000 }));

    vi.useFakeTimers();
    vi.setSystemTime(faker.date.recent());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('with database connection', () => {
    it('should return DOWN status when database query fails', async () => {
      // Arrange
      const dbError = new Error(faker.lorem.sentence());
      mockDataSource.query.mockRejectedValue(dbError);
      const sut = setupHealthCheck(mockConnection);

      // Act
      const result = await sut();

      // Assert
      expect(result.status).toBe(HealthStatus.DOWN);
      expect(result.database?.status).toBe('DOWN');
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return DOWN status when getInstance throws error', async () => {
      // Arrange
      const connectionError = new Error(faker.lorem.sentence());
      const failingConnection = {
        getInstance: vi.fn().mockImplementation(() => {
          throw connectionError;
        }),
      } as unknown as PgConnection;
      const sut = setupHealthCheck(failingConnection);

      // Act
      const result = await sut();

      // Assert
      expect(result.status).toBe(HealthStatus.DOWN);
      expect(result.database?.status).toBe('DOWN');
    });

    it('should return UP status when database is healthy', async () => {
      // Arrange
      mockDataSource.query.mockResolvedValue([{ result: 1 }]);
      const sut = setupHealthCheck(mockConnection);

      // Act
      const result = await sut();

      // Assert
      expect(result.status).toBe(HealthStatus.UP);
      expect(result.database?.status).toBe('UP');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeTypeOf('number');
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });

  describe('without database connection', () => {
    it('should return UP status when connection is null', async () => {
      // Arrange
      const sut = setupHealthCheck(null as unknown as PgConnection);

      // Act
      const result = await sut();

      // Assert
      expect(result.status).toBe(HealthStatus.UP);
      expect(result.database).toBeUndefined();
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeTypeOf('number');
    });

    it('should return UP status when connection is undefined', async () => {
      // Arrange
      const sut = setupHealthCheck(undefined as unknown as PgConnection);

      // Act
      const result = await sut();

      // Assert
      expect(result.status).toBe(HealthStatus.UP);
      expect(result.database).toBeUndefined();
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeTypeOf('number');
    });
  });
});
