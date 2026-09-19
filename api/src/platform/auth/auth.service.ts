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
import { StorageService } from 'src/lib/storage/storage.service';
import { ARGON2_CONFIG } from 'src/config/argon2.config';
import { REDIS_KEYS } from 'src/config/redis-keys.config';
import { generateUniqueCode, CodePrefix } from 'src/lib/prisma/code-generator';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { ClientMetadata } from '../decorator/client-info.decorator';
import { Prisma, PlatformUser } from 'src/generated/prisma/client';

const AUTH_MAX_FAILED_ATTEMPTS = 5;
const AUTH_LOCKOUT_DURATION_MS = 1000 * 60 * 60;

type AuthFailureCounter = 'failedLoginAttempts' | 'failedTwoFactorAttempts';

/**
 * Compares two secrets without leaking their contents through timing. Both sides
 * are hashed first so the comparison is always over equal-length buffers, which
 * `timingSafeEqual` requires.
 */
function codesMatch(presented: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(presented).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
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

    const code = await generateUniqueCode(
      this.prismaService,
      'platformUser',
      CodePrefix.PLATFORM_USER,
    );

    let newUser;
    try {
      newUser = await this.prismaService.platformUser.create({
        data: {
          code,
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    } catch (error) {
      // A concurrent request can register the same address between the check
      // above and this insert.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.redisService.set(
      REDIS_KEYS.platform.user.verification.key(token),
      newUser.id,
      REDIS_KEYS.platform.user.verification.ttl,
    );

    const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();

    try {
      await this.mailService.sendVerificationEmail(
        newUser.email,
        fullName,
        token,
      );
    } catch (error) {
      // The account is left in place and unverified: the verification token is
      // already stored, so resending is enough to recover. Deleting here would
      // also discard a registration that a retry could have completed.
      console.error(
        '[AuthService] Verification Email Dispatch Failure:',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to dispatch account verification email. Please try again.',
      );
    }

    return {
      success: true,
      message:
        'User registered successfully. Please check your email to verify your account.',
    };
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

  async login(dto: LoginDto, clientInfo: ClientMetadata) {
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
      const locked = await this.recordAuthFailure(
        user.id,
        'failedLoginAttempts',
        user.failedLoginAttempts,
      );

      if (locked) {
        throw new UnauthorizedException(
          'Your Account has been locked out for 1 hour. Please try again after 1 hour.',
        );
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
        const mfaToken = crypto.randomBytes(32).toString('hex');

        await this.redisService.set(
          REDIS_KEYS.platform.user.mfa.key(user.id),
          mfaCode,
          REDIS_KEYS.platform.user.mfa.ttl,
        );

        // The client echoes this token back at the second step, so the challenge
        // is bound to the password check that just succeeded. Returning the user
        // id instead would let the second step complete a login for any account.
        await this.redisService.set(
          REDIS_KEYS.platform.user.mfaChallenge.key(mfaToken),
          user.id,
          REDIS_KEYS.platform.user.mfaChallenge.ttl,
        );

        const fullName = `${user.firstName} ${user.lastName}`.trim();
        await this.mailService.send2faCodeEmail(user.email, fullName, mfaCode);

        await this.prismaService.platformUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0 },
        });

        return {
          requireMfa: true,
          mfaToken,
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
      const rawToken = crypto.randomBytes(48).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const sessionCode = await generateUniqueCode(
        this.prismaService,
        'session',
        CodePrefix.SESSION,
      );

      await this.prismaService.session.create({
        data: {
          code: sessionCode,
          token: tokenHash,
          platformUserId: user.id,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      await this.prismaService.platformUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          failedTwoFactorAttempts: 0,
          failedPasswordResetAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          failedLoginAttempts: true,
          failedTwoFactorAttempts: true,
          failedPasswordResetAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
        },
      });

      return {
        success: true,
        message: 'Logged in successfully.',
        token: rawToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('[AuthService] Login Session Creation Failure:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while setting up your login session.',
      );
    }
  }

  async verifyMfa(dto: VerifyMfaDto, clientInfo: ClientMetadata) {
    // Resolved from the challenge issued after the password check, never from the
    // request body: a caller-supplied id would let anyone holding a code - or
    // guessing one - complete a login for an arbitrary account.
    const challengedUserId = await this.redisService.get(
      REDIS_KEYS.platform.user.mfaChallenge.key(dto.mfaToken),
    );

    if (!challengedUserId) {
      throw new UnauthorizedException(
        'This two-factor challenge has expired. Please sign in again.',
      );
    }

    let user = await this.prismaService.platformUser.findUnique({
      where: { id: challengedUserId },
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
      REDIS_KEYS.platform.user.mfa.key(user.id),
    );

    if (!cachedCode) {
      throw new UnauthorizedException(
        'The two-factor authentication code has expired or is invalid.',
      );
    }

    if (!codesMatch(dto.code, cachedCode)) {
      await this.consumeMfaChallenge(dto.mfaToken, user.id);

      const locked = await this.recordAuthFailure(
        user.id,
        'failedTwoFactorAttempts',
        user.failedTwoFactorAttempts,
      );

      if (locked) {
        throw new UnauthorizedException(
          'Your Account has been locked out for 1 hour due to excessive 2FA failures.',
        );
      }

      throw new UnauthorizedException(
        'The two-factor authentication code is incorrect.',
      );
    }

    try {
      await this.consumeMfaChallenge(dto.mfaToken, user.id);

      const rawToken = crypto.randomBytes(48).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const sessionCode = await generateUniqueCode(
        this.prismaService,
        'session',
        CodePrefix.SESSION,
      );

      await this.prismaService.session.create({
        data: {
          code: sessionCode,
          token: tokenHash,
          platformUserId: user.id,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      await this.prismaService.platformUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          failedTwoFactorAttempts: 0,
          failedPasswordResetAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          failedLoginAttempts: true,
          failedTwoFactorAttempts: true,
          failedPasswordResetAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
        },
      });

      return {
        success: true,
        message: 'Logged in successfully via 2FA verification.',
        token: rawToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
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

  /**
   * Clears both halves of a 2FA challenge. Called on every outcome, so a code is
   * single-use whether it was correct or not.
   */
  private async consumeMfaChallenge(mfaToken: string, userId: string) {
    await this.redisService.del(
      REDIS_KEYS.platform.user.mfaChallenge.key(mfaToken),
    );
    await this.redisService.del(REDIS_KEYS.platform.user.mfa.key(userId));
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

      await this.prismaService.$transaction([
        this.prismaService.platformUser.update({
          where: { id: userId },
          data: {
            passwordHash: hashedPassword,
            failedLoginAttempts: 0,
            failedTwoFactorAttempts: 0,
            failedPasswordResetAttempts: 0,
            lockedUntil: null,
          },
        }),
        this.prismaService.session.updateMany({
          where: { platformUserId: userId, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revokeReason: 'Password Reset',
          },
        }),
      ]);

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

  /**
   * Records a failed authentication attempt and locks the account once the
   * strike limit is reached.
   *
   * The counter advances with a compare-and-swap against the value the caller
   * read, so parallel attempts each consume exactly one strike instead of all
   * reading the same stale count. Returns `true` when the account is locked.
   */
  private async recordAuthFailure(
    userId: string,
    counter: AuthFailureCounter,
    attemptsSeen: number,
  ): Promise<boolean> {
    let attempts = attemptsSeen;

    for (let round = 0; round < AUTH_MAX_FAILED_ATTEMPTS; round++) {
      const shouldLock = attempts + 1 >= AUTH_MAX_FAILED_ATTEMPTS;

      const data: Prisma.PlatformUserUpdateManyMutationInput = shouldLock
        ? {
            [counter]: 0,
            lockedUntil: new Date(Date.now() + AUTH_LOCKOUT_DURATION_MS),
          }
        : { [counter]: attempts + 1 };

      const result = await this.prismaService.platformUser.updateMany({
        where: { id: userId, lockedUntil: null, [counter]: attempts },
        data,
      });

      if (result.count === 1) {
        return shouldLock;
      }

      const current = await this.prismaService.platformUser.findUnique({
        where: { id: userId },
        select: {
          failedLoginAttempts: true,
          failedTwoFactorAttempts: true,
          lockedUntil: true,
        },
      });

      if (!current || current.lockedUntil) {
        return true;
      }

      attempts = current[counter];
    }

    return false;
  }

  async logout(sessionId: string) {
    try {
      await this.prismaService.session
        .update({
          where: { id: sessionId },
          data: {
            revokedAt: new Date(),
            revokeReason: 'User Logged Out',
          },
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

  async getMe(user: PlatformUser, sessionId: string) {
    let whiteLabelStatus: string | null = null;
    let isWhiteLabelActive = false;

    if (user.role === 'CLIENT') {
      const sub = await this.prismaService.platformSubscription.findUnique({
        where: { subscriberId: user.id },
        include: {
          whiteLabel: {
            select: {
              id: true,
              status: true,
              code: true,
              name: true,
              subdomain: true,
              customDomain: true,
            },
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (sub?.whiteLabel) {
        whiteLabelStatus = sub.whiteLabel.status;
        isWhiteLabelActive =
          sub.whiteLabel.status === 'APPROVED' && sub.payments.length > 0;
      }
    }

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
        sessionId,
        whiteLabelStatus,
        isWhiteLabelActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
