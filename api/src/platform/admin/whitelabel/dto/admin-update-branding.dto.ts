import { IsOptional, IsString } from 'class-validator';
import { UpdateBrandingDto } from 'src/platform/dto/update-branding.dto';

export class AdminUpdateBrandingDto extends UpdateBrandingDto {
  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  customDomain?: string;
}
