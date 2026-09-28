import { IsOptional, IsString } from 'class-validator';

export class AssignReferrerDto {
  @IsOptional()
  @IsString()
  referrerId?: string | null;
}
