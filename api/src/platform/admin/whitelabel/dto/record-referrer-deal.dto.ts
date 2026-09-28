import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class RecordWhiteLabelReferrerDealDto {
  @IsNotEmpty({ message: 'Selling price in BDT is required.' })
  @IsInt({ message: 'Selling price must be an integer.' })
  @Min(1, { message: 'Selling price must be at least 1 BDT.' })
  sellingPriceBdt: number;

  @IsOptional()
  @IsInt()
  referrerBountyBdt?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
