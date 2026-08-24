import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { SessionGuard } from '../guard/session.guard';
import { CurrentSession } from '../decorator/current-session-decorator';
import { CurrentUser } from '../decorator/current-user.decorator';
import { type PlatformUser } from 'src/generated/prisma/client';
import {
  ClientInfo,
  type ClientMetadata,
} from '../decorator/client-info.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyDto) {
    return await this.authService.verify(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return await this.authService.resendVerification(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@ClientInfo() clientInfo: ClientMetadata, @Body() dto: LoginDto) {
    return await this.authService.login(dto, clientInfo);
  }

  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @ClientInfo() clientInfo: ClientMetadata,
    @Body() dto: VerifyMfaDto,
  ) {
    return await this.authService.verifyMfa(dto, clientInfo);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return await this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async passwordReset(@Body() dto: PasswordResetDto) {
    return await this.authService.passwordReset(dto);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  getCurrentUser(
    @CurrentUser() user: PlatformUser,
    @CurrentSession('id') id: string,
  ) {
    return {
      success: true,
      message: 'Current user fetched successfully',
      user: {
        id: user.id,
        code: user.code,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role,
        image: user.image,
        sessionId: id,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async logout(@CurrentSession('id') sessionId: string) {
    return await this.authService.logout(sessionId);
  }
}
