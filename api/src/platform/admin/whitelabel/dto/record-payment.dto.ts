import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from 'src/generated/prisma/enums';

export class RecordPaymentDto {
  @IsNotEmpty({ message: 'Amount is required.' })
  @IsInt({ message: 'Amount must be an integer (in cents or whole USD).' })
  @Min(0, { message: 'Amount cannot be negative.' })
  @Type(() => Number)
  amount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  discount?: number = 0;

  @IsNotEmpty({ message: 'Start date is required.' })
  @IsDate({ message: 'Start date must be a valid date.' })
  @Type(() => Date)
  startsAt!: Date;

  @IsNotEmpty({ message: 'End date is required.' })
  @IsDate({ message: 'End date must be a valid date.' })
  @Type(() => Date)
  endsAt!: Date;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus = PaymentStatus.COMPLETED;
}
