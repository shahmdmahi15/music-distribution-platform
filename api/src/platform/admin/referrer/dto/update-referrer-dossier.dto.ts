import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateReferrerDossierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  yearsInBusiness?: number;

  @IsOptional()
  @IsBoolean()
  isIncorporated?: boolean;

  @IsOptional()
  @IsString()
  incorporationDocUrl?: string;

  // Primary Contact
  @IsOptional()
  @IsString()
  contactFirstName?: string;

  @IsOptional()
  @IsString()
  contactLastName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactWhatsApp?: string;

  @IsOptional()
  @IsString()
  contactLinkedIn?: string;

  // Commercial Terms
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dealBenchmarkBdt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minGuaranteedBountyBdt?: number;

  @IsOptional()
  @IsString()
  operatingHub?: string;

  // Remittance Dossier
  @IsOptional()
  @IsString()
  payoutMethod?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  branchDistrict?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsString()
  routingNumber?: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;

  @IsOptional()
  @IsString()
  walletNumber?: string;

  // Internal Notes & Meta
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
