import { SetMetadata } from '@nestjs/common';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';

export const WHITELABEL_ROLES_KEY = 'whitelabel_roles';
export const WhiteLabelRoles = (...roles: WhiteLabelUserRole[]) =>
  SetMetadata(WHITELABEL_ROLES_KEY, roles);
