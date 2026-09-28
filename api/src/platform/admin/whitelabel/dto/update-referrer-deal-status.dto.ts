import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateReferrerDealStatusDto {
  @IsNotEmpty({ message: 'Status is required.' })
  @IsString()
  @IsIn(['PENDING', 'PAID', 'CANCELLED'], {
    message: 'Status must be one of: PENDING, PAID, CANCELLED.',
  })
  status: string;
}
