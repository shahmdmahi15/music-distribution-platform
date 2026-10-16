import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class ExecuteRoyaltyRunDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'period must be in YYYY-MM format (e.g. 2026-03)',
  })
  period: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  exchangeRateUsdToBdt?: number = 120.0;
}
