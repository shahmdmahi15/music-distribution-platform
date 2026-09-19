import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';

export class QueryWhitelabelUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(WhiteLabelUserRole)
  role?: WhiteLabelUserRole;

  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit: number = 20;
}
