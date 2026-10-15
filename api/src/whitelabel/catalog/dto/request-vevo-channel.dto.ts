import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestVevoChannelDto {
  @IsString()
  @IsNotEmpty()
  channelName!: string;

  @IsString()
  @IsOptional()
  artistName?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
