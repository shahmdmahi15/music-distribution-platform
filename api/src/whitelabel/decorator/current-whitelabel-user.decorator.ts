import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WhiteLabelUser } from 'src/generated/prisma/client';

export const CurrentWhiteLabelUser = createParamDecorator(
  (data: keyof WhiteLabelUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as WhiteLabelUser;

    return data ? user?.[data] : user;
  },
);
