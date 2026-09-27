import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReferrerApplicationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsNotEmpty({ message: 'Country is required.' })
  @IsString()
  country: string;

  @IsOptional()
  @IsNumber()
  yearsInBusiness?: number;

  @IsOptional()
  @IsBoolean()
  isIncorporated?: boolean;

  @IsOptional()
  @IsString()
  incorporationDocUrl?: string;

  @IsNotEmpty()
  @IsString()
  contactFirstName: string;

  @IsNotEmpty()
  @IsString()
  contactLastName: string;

  @IsNotEmpty()
  @IsEmail()
  contactEmail: string;

  @IsNotEmpty({ message: 'WhatsApp number is required.' })
  @IsString()
  contactWhatsApp: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactLinkedIn?: string;

  // Remittance configuration
  @IsNotEmpty()
  @IsString()
  payoutMethod: string; // 'BANK_TRANSFER' | 'BKASH' | 'NAGAD' | 'ROCKET'

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

  @IsOptional()
  onboardingDetails?: Record<string, any>;
}
