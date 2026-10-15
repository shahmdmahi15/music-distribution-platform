import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PayeeRole, PayeeStatus } from 'src/generated/prisma/client';

export class CreatePayeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  legalName?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsEnum(PayeeRole)
  @IsOptional()
  role?: PayeeRole = PayeeRole.ARTIST;

  @IsEnum(PayeeStatus)
  @IsOptional()
  status?: PayeeStatus = PayeeStatus.ACTIVE;

  @IsString()
  @IsOptional()
  paymentMethod?: string = 'BANK_TRANSFER';

  @IsOptional()
  paymentDetails?: Record<string, any>;
}
