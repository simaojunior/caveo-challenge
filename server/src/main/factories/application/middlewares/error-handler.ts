import { HttpErrorHandler } from '@/application/middlewares/error-handler';

export const makeErrorHandler = (): HttpErrorHandler => {
  return new HttpErrorHandler();
};
