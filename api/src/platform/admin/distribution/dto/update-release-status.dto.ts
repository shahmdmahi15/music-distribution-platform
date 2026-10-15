import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReleaseStatus } from 'src/generated/prisma/client';

export class UpdateReleaseStatusDto {
  @IsEnum(ReleaseStatus)
  @IsNotEmpty()
  status!: ReleaseStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
