import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractLevel, ContractStatus, MechanicalType, PayeeRole } from 'src/generated/prisma/client';

export class ContractSplitItemDto {
  @IsString()
  @IsNotEmpty()
  payeeId: string;

  @IsNumber()
  percentage: number; // e.g. 50 or 50.00

  @IsEnum(PayeeRole)
  @IsOptional()
  role?: PayeeRole = PayeeRole.ARTIST;
}

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  whiteLabelId: string;

  @IsString()
  @IsNotEmpty()
  name: string; // mapped to title in schema

  @IsEnum(ContractLevel)
  @IsOptional()
  level?: ContractLevel = ContractLevel.RELEASE;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus = ContractStatus.ACTIVE;

  @IsString()
  @IsOptional()
  targetId?: string; // releaseId, trackId, or artistId

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractSplitItemDto)
  splits: ContractSplitItemDto[];

  @IsBoolean()
  @IsOptional()
  allFutureAssets?: boolean = false;

  @IsBoolean()
  @IsOptional()
  payMechanicals?: boolean = false;

  @IsEnum(MechanicalType)
  @IsOptional()
  mechanicalType?: MechanicalType;

  @IsNumber()
  @IsOptional()
  advanceAmount?: number = 0;
}
