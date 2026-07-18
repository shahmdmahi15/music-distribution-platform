import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('verify')
  async verify(@Body() dto: VerifyDto) {
    return await this.authService.verify(dto);
  }

  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return await this.authService.resendVerification(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('verify-mfa')
  async verifyMfa(@Body() dto: VerifyMfaDto) {
    return await this.authService.verifyMfa(dto);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return await this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset')
  async passwordReset(@Body() dto: PasswordResetDto) {
    return await this.authService.passwordReset(dto);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    return await this.authService.logout(dto);
  }
}
