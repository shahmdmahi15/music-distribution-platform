import { IsNotEmpty, IsString } from 'class-validator';

export class RequestReportUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  whiteLabelId!: string;

  @IsString()
  @IsNotEmpty()
  reportingPeriod!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
