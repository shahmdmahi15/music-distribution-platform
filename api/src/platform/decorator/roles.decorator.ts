import { SetMetadata } from '@nestjs/common';
import { PlatformUserRole } from 'src/generated/prisma/enums';

export const ROLES_KEY = 'roles';

/**
 * Narrows a handler to the listed roles. Enforced by `RolesGuard`.
 *
 * Handlers without this decorator fall back to the realm gate applied by
 * `AdminMiddleware` / `ClientMiddleware`.
 */
export const Roles = (...roles: PlatformUserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
