import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../guard/session.guard';
import { PlatformUser } from 'src/generated/prisma/client';

export const CurrentUser = createParamDecorator(
  (
    data: keyof PlatformUser | undefined,
    ctx: ExecutionContext,
  ): PlatformUser | PlatformUser[keyof PlatformUser] | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
