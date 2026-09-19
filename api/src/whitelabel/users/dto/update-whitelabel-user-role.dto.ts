import { IsEnum, IsNotEmpty } from 'class-validator';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';

export class UpdateWhitelabelUserRoleDto {
  @IsNotEmpty({ message: 'Role is required.' })
  @IsEnum(WhiteLabelUserRole, { message: 'Invalid role specified.' })
  role!: WhiteLabelUserRole;
}
