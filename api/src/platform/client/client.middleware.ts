import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import {
  CLIENT_ROLES,
  SessionAuthService,
} from '../session/session-auth.service';
import { AuthenticatedRequest } from '../guard/session.guard';

/**
 * Realm gate for `platform/client/*`. Authenticates the session and requires the
 * CLIENT role. Per-handler narrowing is done with `@Roles(...)`.
 */
@Injectable()
export class ClientMiddleware implements NestMiddleware {
  constructor(private readonly sessionAuthService: SessionAuthService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { user, session } = await this.sessionAuthService.authenticate(
      req.headers.authorization,
      CLIENT_ROLES,
    );

    req.user = user;
    req.session = session;

    next();
  }
}
