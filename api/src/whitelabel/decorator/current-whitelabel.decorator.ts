import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WhitelabelRequest } from '../whitelabel.middleware';
import { WhiteLabel } from 'src/generated/prisma/client';

export const CurrentWhiteLabel = createParamDecorator(
  (data: keyof WhiteLabel | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<WhitelabelRequest>();
    const whiteLabel = request.whiteLabel;

    return data ? whiteLabel?.[data] : whiteLabel;
  },
);
