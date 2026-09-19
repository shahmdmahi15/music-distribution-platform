import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformUserRole } from 'src/generated/prisma/enums';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { AuthenticatedRequest } from './session.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      PlatformUserRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    // No @Roles() on the handler: the realm gate already ran, so allow through.
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role;

    if (!role || !required.includes(role)) {
      throw new ForbiddenException(
        'You are not allowed to access these resource',
      );
    }

    return true;
  }
}
