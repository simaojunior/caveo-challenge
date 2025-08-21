import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { Saga } from './saga';

vi.mock('@/infra/shared/logging/logger', () => ({
  createModuleLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Saga Pattern', () => {
  let saga: Saga;

  beforeEach(() => {
    saga = new Saga();
  });

  describe('successful execution', () => {
    it('should execute the function and return result when no errors occur', async () => {
      // Arrange
      const expectedResult = faker.string.uuid();
      const mockFn = vi.fn().mockResolvedValue(expectedResult);

      // Act
      const result = await saga.run(mockFn);

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should not execute compensations when function succeeds', async () => {
      // Arrange
      const compensation1 = vi.fn().mockResolvedValue(undefined);
      const compensation2 = vi.fn().mockResolvedValue(undefined);
      saga.addCompensation(compensation1);
      saga.addCompensation(compensation2);

      const mockFn = vi.fn().mockResolvedValue('success');

      // Act
      await saga.run(mockFn);

      // Assert
      expect(compensation1).not.toHaveBeenCalled();
      expect(compensation2).not.toHaveBeenCalled();
    });
  });

  describe('error handling and compensation', () => {
    it('should execute compensations in reverse order when function fails', async () => {
      // Arrange
      const executionOrder: number[] = [];
      const compensation1 = vi.fn().mockImplementation(() => {
        executionOrder.push(1);

        return Promise.resolve();
      });
      const compensation2 = vi.fn().mockImplementation(() => {
        executionOrder.push(2);

        return Promise.resolve();
      });

      saga.addCompensation(compensation1);
      saga.addCompensation(compensation2);

      const error = new Error(faker.lorem.sentence());
      const mockFn = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(saga.run(mockFn)).rejects.toThrow(error);
      expect(executionOrder).toEqual([2, 1]); // Reverse order
      expect(compensation1).toHaveBeenCalledOnce();
      expect(compensation2).toHaveBeenCalledOnce();
    });

    it('should continue compensation even if one compensation fails', async () => {
      // Arrange
      const compensation1 = vi.fn().mockResolvedValue(undefined);
      const compensation2 = vi.fn().mockRejectedValue(new Error('Compensation failed'));
      const compensation3 = vi.fn().mockResolvedValue(undefined);

      saga.addCompensation(compensation1);
      saga.addCompensation(compensation2);
      saga.addCompensation(compensation3);

      const error = new Error(faker.lorem.sentence());
      const mockFn = vi.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(saga.run(mockFn)).rejects.toThrow(error);
      expect(compensation1).toHaveBeenCalledOnce();
      expect(compensation2).toHaveBeenCalledOnce();
      expect(compensation3).toHaveBeenCalledOnce();
    });

    it('should preserve the original error even if compensations fail', async () => {
      // Arrange
      const originalError = new Error('Original error');
      const compensation = vi.fn().mockRejectedValue(new Error('Compensation error'));

      saga.addCompensation(compensation);
      const mockFn = vi.fn().mockRejectedValue(originalError);

      // Act & Assert
      await expect(saga.run(mockFn)).rejects.toThrow(originalError);
    });
  });

  describe('compensation management', () => {
    it('should add compensations in LIFO order', async () => {
      // Arrange
      const executionOrder: string[] = [];
      const compensation1 = vi.fn().mockImplementation(() => {
        executionOrder.push('first');

        return Promise.resolve();
      });
      const compensation2 = vi.fn().mockImplementation(() => {
        executionOrder.push('second');

        return Promise.resolve();
      });
      const compensation3 = vi.fn().mockImplementation(() => {
        executionOrder.push('third');

        return Promise.resolve();
      });

      saga.addCompensation(compensation1);
      saga.addCompensation(compensation2);
      saga.addCompensation(compensation3);

      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));

      // Act
      await expect(saga.run(mockFn)).rejects.toThrow();

      // Assert
      expect(executionOrder).toEqual(['third', 'second', 'first']);
    });
  });
});
