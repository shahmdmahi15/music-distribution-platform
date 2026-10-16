import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ExecuteRoyaltyRunDto {
  @IsString()
  @IsOptional()
  period?: string;

  @IsString()
  @IsOptional()
  reportingPeriod?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  exchangeRateUsdToBdt?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  exchangeRateBdtUsd?: number;

  @IsString()
  @IsOptional()
  whiteLabelId?: string;

  @IsString()
  @IsOptional()
  store?: string;
}
