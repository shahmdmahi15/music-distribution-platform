import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WhitelabelSessionAuthService } from '../session/whitelabel-session-auth.service';
import { WhitelabelRequest } from '../whitelabel.middleware';
import { WhiteLabelUser, Session } from 'src/generated/prisma/client';

export interface AuthenticatedWhitelabelRequest extends WhitelabelRequest {
  user: WhiteLabelUser;
  session: Session;
}

@Injectable()
export class WhitelabelSessionGuard implements CanActivate {
  constructor(
    private readonly whitelabelSessionAuthService: WhitelabelSessionAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedWhitelabelRequest>();

    const tenantId = request.whiteLabel?.id;

    const { user, session } =
      await this.whitelabelSessionAuthService.authenticate(
        request.headers.authorization,
        tenantId,
      );

    request.user = user;
    request.session = session;

    return true;
  }
}
