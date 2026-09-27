import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReferrerDealDto {
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sellingPriceBdt: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  referrerBountyBdt?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
