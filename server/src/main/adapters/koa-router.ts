import type { Controller } from '@/application/contracts';
import type { IAppContext } from '@/main/@types/app-context';
import {
  mapKoaContextToHttpRequest,
  mapHttpResponseToKoaContext,
} from './shared/koa-mapping';

export const adaptKoaRoute = (controller: Controller) => {
  return async (ctx: IAppContext): Promise<void> => {
    const request = mapKoaContextToHttpRequest(ctx);
    const response = await controller.handle(request);
    mapHttpResponseToKoaContext(ctx, response);
  };
};
