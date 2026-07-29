import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface ClientMetadata {
  ip: string;
  userAgent: string;
}

export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientMetadata => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Extract the headers your Next.js Axios interceptor is passing
    const ip =
      (request.headers['x-real-ip'] as string) || request.ip || '127.0.0.1';
    const userAgent =
      (request.headers['user-agent'] as string) || 'Unknown-Agent';

    return { ip, userAgent };
  },
);
