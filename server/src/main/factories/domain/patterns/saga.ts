import { Saga } from '@/domain/patterns/saga';

export const makeSaga = (): Saga => {
  return new Saga();
};
