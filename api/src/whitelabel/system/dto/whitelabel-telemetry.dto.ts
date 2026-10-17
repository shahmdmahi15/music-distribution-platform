import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum WhitelabelUpdateStatus {
  UP_TO_DATE = 'UP_TO_DATE',
  UPDATING = 'UPDATING',
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
  UPDATE_SUCCESS = 'UPDATE_SUCCESS',
  UPDATE_FAILED = 'UPDATE_FAILED',
}

export class WhitelabelTelemetryDto {
  @IsString()
  installedVersion: string;

  @IsOptional()
  @IsString()
  commitHash?: string;

  @IsEnum(WhitelabelUpdateStatus)
  status: WhitelabelUpdateStatus;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  nodeVersion?: string;

  @IsOptional()
  @IsNumber()
  uptimeSeconds?: number;
}
