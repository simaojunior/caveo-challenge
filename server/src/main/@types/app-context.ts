import type { UserRole } from '@/domain/entities/user';
import type { Request, ParameterizedContext } from 'koa';

/**
 * Declaration for application state object.
 * Use this as context type in controllers.
 */
export type AppState = {
  user?: {
    id: string;
    jwt?: string;
    roles?: UserRole[];
  };
};

export interface IAppRequest<RequestBodyT = any> extends Request {
  body?: RequestBodyT;
  files?: Record<string, any>;
}

export interface IAppDefaultContext<RequestBodyT>
  extends ParameterizedContext<AppState> {
  request: IAppRequest<RequestBodyT>;
}

export type IAppContext<RequestBodyT = unknown> =
  IAppDefaultContext<RequestBodyT>;
