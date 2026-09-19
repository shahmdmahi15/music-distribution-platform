import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WhitelabelAuthService } from './whitelabel-auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import { CurrentWhiteLabelUser } from '../decorator/current-whitelabel-user.decorator';
import { CurrentSession } from 'src/platform/decorator/current-session-decorator';
import {
  type WhiteLabel,
  type WhiteLabelUser,
  type Session,
} from 'src/generated/prisma/client';
import {
  ClientInfo,
  type ClientMetadata,
} from 'src/platform/decorator/client-info.decorator';

@Controller('auth')
export class WhitelabelAuthController {
  constructor(private readonly authService: WhitelabelAuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async register(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: RegisterDto,
  ) {
    return await this.authService.register(whiteLabel, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async verify(@Body() dto: VerifyDto) {
    return await this.authService.verify(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async resendVerification(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: ResendVerificationDto,
  ) {
    return await this.authService.resendVerification(whiteLabel, dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  async login(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @ClientInfo() clientInfo: ClientMetadata,
    @Body() dto: LoginDto,
  ) {
    return await this.authService.login(whiteLabel, dto, clientInfo);
  }

  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyMfa(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @ClientInfo() clientInfo: ClientMetadata,
    @Body() dto: VerifyMfaDto,
  ) {
    return await this.authService.verifyMfa(whiteLabel, dto, clientInfo);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async requestPasswordReset(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: RequestPasswordResetDto,
  ) {
    return await this.authService.requestPasswordReset(whiteLabel, dto);
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async passwordReset(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Body() dto: PasswordResetDto,
  ) {
    return await this.authService.passwordReset(whiteLabel, dto);
  }

  @Get('me')
  @UseGuards(WhitelabelSessionGuard)
  getCurrentUser(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @CurrentWhiteLabelUser() user: WhiteLabelUser,
    @CurrentSession() session: Session,
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
        role: user.role,
        image: user.image,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        sessionId: session.id,
      },
      tenant: {
        id: whiteLabel.id,
        code: whiteLabel.code,
        name: whiteLabel.name,
        subdomain: whiteLabel.subdomain,
        customDomain: whiteLabel.customDomain,
        logoUrl: whiteLabel.logoUrl,
        primaryColor: whiteLabel.primaryColor,
        accentColor: whiteLabel.accentColor,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WhitelabelSessionGuard)
  async logout(@CurrentSession('id') sessionId: string) {
    return await this.authService.logout(sessionId);
  }
}
