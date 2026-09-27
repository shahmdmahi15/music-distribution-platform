import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReferrerStatus } from 'src/generated/prisma/enums';

export class UpdateReferrerStatusDto {
  @IsEnum(ReferrerStatus)
  status: ReferrerStatus;

  @IsOptional()
  @IsString()
  statusReason?: string;
}
