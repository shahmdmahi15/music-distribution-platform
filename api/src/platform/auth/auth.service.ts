import {
  ConflictException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { RedisService } from 'src/lib/redis/redis.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { MailService } from 'src/lib/mail/mail.service';
import { ARGON2_CONFIG } from 'src/config/argon2.config';
import { REDIS_KEYS } from 'src/config/redis-keys.config';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LoginDto } from './dto/login.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { PasswordResetDto } from './dto/password-reset.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prismaService.platformUser.findUnique({
      where: { email: dto.email },
      select: { email: true },
    });

    if (userExists) {
      throw new ConflictException('A user with this email already exists.');
    }

    const hashedPassword = await argon2.hash(dto.password, ARGON2_CONFIG);

    const newUser = await this.prismaService.platformUser.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    try {
      const token = crypto.randomBytes(32).toString('hex');

      await this.redisService.set(
        REDIS_KEYS.platform.user.verification.key(token),
        newUser.id,
        REDIS_KEYS.platform.user.verification.ttl,
      );

      const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();
      await this.mailService.sendVerificationEmail(
        newUser.email,
        fullName,
        token,
      );

      return {
        success: true,
        message:
          'User registered successfully. Please check your email to verify your account.',
      };
    } catch (error) {
      console.error(
        '[AuthService] Mailing or Token Provisioning Failure:',
        error,
      );
      await this.prismaService.platformUser
        .delete({ where: { id: newUser.id } })
        .catch(() => {});

      throw new InternalServerErrorException(
        'Failed to dispatch account verification email. Please try again.',
      );
    }
  }

  async verify(dto: VerifyDto) {
    const userId = await this.redisService.get(
      REDIS_KEYS.platform.user.verification.key(dto.token),
    );

    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    const dbUser = await this.prismaService.platformUser.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true },
    });

    if (!dbUser) {
      throw new BadRequestException(
        'User associated with this token does not exist.',
      );
    }

    if (dbUser.emailVerified) {
      throw new ConflictException('User email is already verified.');
    }

    try {
      await this.prismaService.platformUser.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          failedLoginAttempts: 0,
          failedTwoFactorAttempts: 0,
          failedPasswordResetAttempts: 0,
          lockedUntil: null,
        },
      });

      await this.redisService.del(
        REDIS_KEYS.platform.user.verification.key(dto.token),
      );

      return {
        success: true,
        message: 'User verified successfully.',
      };
    } catch (error) {
      console.error('[AuthService] Verification Pipeline Failure:', error);
      throw new InternalServerErrorException(
        'Failed to complete account verification.',
      );
    }
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prismaService.platformUser.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return {
        success: true,
        message:
          'If the email is registered, a new verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      throw new ConflictException('This email address is already verified.');
    }

    try {
      const token = crypto.randomBytes(32).toString('hex');

      await this.redisService.set(
        REDIS_KEYS.platform.user.verification.key(token),
        user.id,
        REDIS_KEYS.platform.user.verification.ttl,
      );

      const fullName = `${user.firstName} ${user.lastName}`.trim();
      await this.mailService.sendVerificationEmail(user.email, fullName, token);

      return {
        success: true,
        message:
          'If the email is registered, a new verification link has been sent.',
      };
    } catch (error) {
      console.error(
        '[AuthService] Resend Verification Pipeline Failure:',
        error,
      );
      throw new InternalServerErrorException(
        'An unexpected backend error occurred while processing your request.',
      );
    }
  }

  async login(dto: LoginDto) {
    let user = await this.prismaService.platformUser.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }

    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        throw new UnauthorizedException(
          'Your account has been locked out. Try again later.',
        );
      } else {
        user = await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            failedTwoFactorAttempts: 0,
            failedPasswordResetAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses another authentication method. Please sign in using the previously used method.',
      );
    }

    if (!(await argon2.verify(user.passwordHash, dto.password))) {
      if (user.failedLoginAttempts >= 4) {
        await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: new Date(Date.now() + 1000 * 60 * 60),
          },
        });
        throw new UnauthorizedException(
          'Your Account has been locked out for 1 hour. Please try again after 1 hour.',
        );
      } else {
        await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: { increment: 1 } },
        });
      }
      throw new UnauthorizedException('Invalid Login Credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Your email address has not been verified yet.',
      );
    }

    if (user.twoFactorEnabled) {
      try {
        const mfaCode = crypto.randomInt(100000, 999999).toString();

        await this.redisService.set(
          REDIS_KEYS.platform.user.mfa.key(user.id),
          mfaCode,
          REDIS_KEYS.platform.user.mfa.ttl,
        );

        const fullName = `${user.firstName} ${user.lastName}`.trim();
        await this.mailService.send2faCodeEmail(user.email, fullName, mfaCode);

        await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0 },
        });

        return {
          require2FA: true,
          userId: user.id,
          message:
            'Two-factor authentication code sent to your registered email address.',
        };
      } catch (error) {
        console.error(
          '[AuthService] 2FA Code Generation/Dispatch Failure:',
          error,
        );
        throw new InternalServerErrorException(
          'Failed to send two-factor authentication challenge.',
        );
      }
    }

    try {
      const sessionToken = crypto.randomBytes(48).toString('hex');
      const session = await this.prismaService.session.create({
        data: {
          token: sessionToken,
          platformUserId: user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      await this.redisService.set(
        REDIS_KEYS.platform.session.token.key(session.token),
        JSON.stringify(session),
        REDIS_KEYS.platform.session.token.ttl,
      );

      await this.prismaService.platformUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          failedTwoFactorAttempts: 0,
          failedPasswordResetAttempts: 0,
          lockedUntil: null,
        },
      });

      return {
        success: true,
        message: 'Logged in successfully.',
        sessionToken: session.token,
      };
    } catch (error) {
      console.error('[AuthService] Login Session Creation Failure:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while setting up your login session.',
      );
    }
  }

  async verify2FA(dto: Verify2faDto) {
    let user = await this.prismaService.platformUser.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }

    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        throw new UnauthorizedException(
          'Your account has been locked out. Try again later.',
        );
      } else {
        user = await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            failedTwoFactorAttempts: 0,
            failedPasswordResetAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    }

    const cachedCode = await this.redisService.get(
      REDIS_KEYS.platform.user.mfa.key(dto.userId),
    );

    if (!cachedCode) {
      throw new UnauthorizedException(
        'The two-factor authentication code has expired or is invalid.',
      );
    }

    if (cachedCode !== dto.code) {
      await this.redisService.del(REDIS_KEYS.platform.user.mfa.key(dto.userId));

      if (user.failedTwoFactorAttempts >= 4) {
        await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: {
            failedTwoFactorAttempts: 0,
            lockedUntil: new Date(Date.now() + 1000 * 60 * 60),
          },
        });
        throw new UnauthorizedException(
          'Your Account has been locked out for 1 hour due to excessive 2FA failures.',
        );
      } else {
        await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: { failedTwoFactorAttempts: { increment: 1 } },
        });
      }
      throw new UnauthorizedException(
        'The two-factor authentication code is incorrect.',
      );
    }

    try {
      await this.redisService.del(REDIS_KEYS.platform.user.mfa.key(dto.userId));

      const sessionToken = crypto.randomBytes(48).toString('hex');
      const session = await this.prismaService.session.create({
        data: {
          token: sessionToken,
          platformUserId: dto.userId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      await this.redisService.set(
        REDIS_KEYS.platform.session.token.key(session.token),
        JSON.stringify(session),
        REDIS_KEYS.platform.session.token.ttl,
      );

      await this.prismaService.platformUser.update({
        where: { id: dto.userId },
        data: {
          failedLoginAttempts: 0,
          failedTwoFactorAttempts: 0,
          failedPasswordResetAttempts: 0,
          lockedUntil: null,
        },
      });

      return {
        success: true,
        message: 'Logged in successfully via 2FA verification.',
        sessionToken: session.token,
      };
    } catch (error) {
      console.error(
        '[AuthService] 2FA Verification Flow Session Error:',
        error,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred while compiling your login session.',
      );
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prismaService.platformUser.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return {
        success: true,
        message:
          'If the email address is registered, a password reset link has been sent.',
      };
    }

    try {
      const token = crypto.randomBytes(32).toString('hex');

      await this.redisService.set(
        REDIS_KEYS.platform.user.passwordReset.key(token),
        user.id,
        REDIS_KEYS.platform.user.passwordReset.ttl,
      );

      const fullName = `${user.firstName} ${user.lastName}`.trim();
      await this.mailService.sendPasswordResetEmail(
        user.email,
        fullName,
        token,
      );

      return {
        success: true,
        message:
          'If the email address is registered, a password reset link has been sent.',
      };
    } catch (error) {
      console.error('[AuthService] Password Reset Request Failure:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while processing your password reset request.',
      );
    }
  }

  async passwordReset(dto: PasswordResetDto) {
    const historicalBadHits = await this.redisService.get(
      REDIS_KEYS.platform.user.badResetToken.key(dto.token),
    );

    if (historicalBadHits && parseInt(historicalBadHits, 10) >= 5) {
      throw new BadRequestException(
        'This token has been blocked due to excessive invalid tracking attempts.',
      );
    }

    const userId = await this.redisService.get(
      REDIS_KEYS.platform.user.passwordReset.key(dto.token),
    );

    if (!userId) {
      const currentHits = historicalBadHits
        ? parseInt(historicalBadHits, 10)
        : 0;
      await this.redisService.set(
        REDIS_KEYS.platform.user.badResetToken.key(dto.token),
        (currentHits + 1).toString(),
        REDIS_KEYS.platform.user.badResetToken.ttl,
      );
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const user = await this.prismaService.platformUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(
        'User associated with this token does not exist.',
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Your account is currently locked out. Try again later.',
      );
    }

    if (user.failedPasswordResetAttempts >= 4) {
      await this.prismaService.platformUser.update({
        where: { id: user.id },
        data: {
          failedPasswordResetAttempts: 0,
          lockedUntil: new Date(Date.now() + 1000 * 60 * 60),
        },
      });
      await this.redisService.del(
        REDIS_KEYS.platform.user.passwordReset.key(dto.token),
      );
      throw new UnauthorizedException(
        'Your account has been locked out for 1 hour due to excessive failed password reset operations.',
      );
    }

    try {
      const hashedPassword = await argon2.hash(dto.newPassword, ARGON2_CONFIG);

      await this.prismaService.platformUser.update({
        where: { id: userId },
        data: {
          passwordHash: hashedPassword,
          failedLoginAttempts: 0,
          failedTwoFactorAttempts: 0,
          failedPasswordResetAttempts: 0,
          lockedUntil: null,
        },
      });

      await this.redisService.del(
        REDIS_KEYS.platform.user.passwordReset.key(dto.token),
      );

      return {
        success: true,
        message:
          'Your password has been successfully reset. You can now log in.',
      };
    } catch (error) {
      console.error('[AuthService] Password Reset Execution Failure:', error);

      await this.prismaService.platformUser.update({
        where: { id: user.id },
        data: { failedPasswordResetAttempts: { increment: 1 } },
      });

      throw new InternalServerErrorException(
        'Failed to update your password. Please try again.',
      );
    }
  }

  async logout(sessionToken: string) {
    if (!sessionToken) {
      throw new BadRequestException('No session token provided.');
    }

    try {
      await this.redisService.del(
        REDIS_KEYS.platform.session.token.key(sessionToken),
      );

      await this.prismaService.session
        .delete({
          where: { token: sessionToken },
        })
        .catch(() => {});

      return {
        success: true,
        message: 'Logged out successfully.',
      };
    } catch (error) {
      console.error('[AuthService] Logout Failure:', error);
      throw new InternalServerErrorException(
        'An error occurred during logout.',
      );
    }
  }
}
