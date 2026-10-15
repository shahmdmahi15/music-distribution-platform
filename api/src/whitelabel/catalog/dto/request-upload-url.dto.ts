import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RequestUploadUrlDto {
  @IsIn(['AUDIO', 'COVER_ART'])
  @IsNotEmpty()
  type!: 'AUDIO' | 'COVER_ART';

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
