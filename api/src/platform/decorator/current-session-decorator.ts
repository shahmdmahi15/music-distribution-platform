import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../guard/session.guard';
import { Session } from 'src/generated/prisma/client';

export const CurrentSession = createParamDecorator(
  (
    data: keyof Session | undefined,
    ctx: ExecutionContext,
  ): Session | Session[keyof Session] | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = request.session;

    return data ? session?.[data] : session;
  },
);
