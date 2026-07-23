import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as Prisma from 'src/generated/prisma/client';
import { AuthenticatedRequest } from '../guard/session.guard';

export const CurrentSession = createParamDecorator(
  (
    data: keyof Prisma.Session | undefined,
    ctx: ExecutionContext,
  ): Prisma.Session | Prisma.Session[keyof Prisma.Session] | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = request.session;

    return data ? session?.[data] : session;
  },
);
