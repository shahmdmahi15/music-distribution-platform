import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { resolveClientIp } from 'src/lib/client-ip/client-ip.util';

export interface ClientMetadata {
  ip: string;
  userAgent: string;
}

export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientMetadata => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const userAgent =
      (request.headers['user-agent'] as string) || 'Unknown-Agent';

    return { ip: resolveClientIp(request), userAgent };
  },
);
