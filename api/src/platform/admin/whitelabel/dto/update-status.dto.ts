import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WhiteLabelStatus } from 'src/generated/prisma/enums';

export class UpdateWhiteLabelStatusDto {
  @IsNotEmpty({ message: 'Status is required.' })
  @IsEnum(WhiteLabelStatus, {
    message:
      'Status must be a valid WhiteLabelStatus (PENDING, UNDER_REVIEW, PROCESSING, CONTRACTED, PAID, ACTIVE, REJECTED, or SUSPENDED).',
  })
  status!: WhiteLabelStatus;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  statusReason?: string;
}
