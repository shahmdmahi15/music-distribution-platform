import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PlatformUser, Session } from 'src/generated/prisma/client';
import { SessionAuthService } from '../session/session-auth.service';

export interface AuthenticatedRequest extends Request {
  user: PlatformUser;
  session: Session;
}

/**
 * Authenticates a request against any role. Used by handlers that are not
 * scoped to a realm (e.g. `auth/me`, `auth/logout`).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionAuthService: SessionAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const { user, session } = await this.sessionAuthService.authenticate(
      request.headers.authorization,
    );

    request.user = user;
    request.session = session;

    return true;
  }
}
