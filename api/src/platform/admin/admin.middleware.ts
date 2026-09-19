import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import {
  ADMIN_ROLES,
  SessionAuthService,
} from '../session/session-auth.service';
import { AuthenticatedRequest } from '../guard/session.guard';

/**
 * Realm gate for `platform/admin/*`. Authenticates the session and requires an
 * administrative role. Per-handler narrowing is done with `@Roles(...)`.
 */
@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(private readonly sessionAuthService: SessionAuthService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { user, session } = await this.sessionAuthService.authenticate(
      req.headers.authorization,
      ADMIN_ROLES,
    );

    req.user = user;
    req.session = session;

    next();
  }
}
