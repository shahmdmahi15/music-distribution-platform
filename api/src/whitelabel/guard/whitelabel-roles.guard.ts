import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';
import { WHITELABEL_ROLES_KEY } from '../decorator/whitelabel-roles.decorator';
import { AuthenticatedWhitelabelRequest } from './whitelabel-session.guard';

@Injectable()
export class WhitelabelRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      WhiteLabelUserRole[] | undefined
    >(WHITELABEL_ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedWhitelabelRequest>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException(
        'Authentication required to evaluate roles.',
      );
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have the required permissions for this action.',
      );
    }

    return true;
  }
}
