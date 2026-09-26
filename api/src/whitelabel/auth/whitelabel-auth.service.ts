import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
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
import {
  WhiteLabel,
  WhiteLabelSignupModel,
  WhiteLabelUserRole,
  Prisma,
} from 'src/generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { ClientMetadata } from 'src/platform/decorator/client-info.decorator';

const AUTH_MAX_FAILED_ATTEMPTS = 5;
const AUTH_LOCKOUT_DURATION_MS = 1000 * 60 * 60; // 1 hour

function codesMatch(presented: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(presented).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

@Injectable()
export class WhitelabelAuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
  ) {}

  async register(whiteLabel: WhiteLabel, dto: RegisterDto) {
    const existingUser = await this.prismaService.whiteLabelUser.findUnique({
      where: {
        email_whiteLabelId: {
          email: dto.email,
          whiteLabelId: whiteLabel.id,
        },
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists in this portal.',
      );
    }

    // Determine initial role: if this is the first user in this tenant, make them OWNER, else respect policy
    const totalUsersInTenant = await this.prismaService.whiteLabelUser.count({
      where: { whiteLabelId: whiteLabel.id },
    });

    const isFirstUser = totalUsersInTenant === 0;

    const onboarding =
      (whiteLabel.onboardingDetails as Record<string, any>) || {};
    const regPolicy = (onboarding.registrationPolicy as Record<string, any>) || {};
    const inviteCodes = (regPolicy.inviteCodes as Array<any>) || [];

    // Enforce Registration Policy for non-first users
    if (!isFirstUser && whiteLabel.userSignupModel === WhiteLabelSignupModel.INVITE_ONLY) {
      if (!dto.inviteCode || !dto.inviteCode.trim()) {
        throw new ForbiddenException(
          'This portal operates on an invitation-only policy. A valid invitation code is required to register.',
        );
      }

      const normalizedCode = dto.inviteCode.trim().toUpperCase();
      const matchingCode = inviteCodes.find(
        (c) =>
          c.code &&
          c.code.toUpperCase() === normalizedCode &&
          c.isActive !== false,
      );

      if (!matchingCode) {
        throw new ForbiddenException(
          'Invalid invitation code. Please verify your code or contact the portal administrator.',
        );
      }

      if (matchingCode.expiresAt && new Date(matchingCode.expiresAt) < new Date()) {
        throw new ForbiddenException(
          'This invitation code has expired. Please request a new invitation.',
        );
      }

      if (
        matchingCode.maxUses &&
        (matchingCode.usedCount || 0) >= matchingCode.maxUses
      ) {
        throw new ForbiddenException(
          'This invitation code has reached its maximum registration limit.',
        );
      }

      // Record invite code redemption
      matchingCode.usedCount = (matchingCode.usedCount || 0) + 1;
      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabel.id },
        data: {
          onboardingDetails: {
            ...onboarding,
            registrationPolicy: {
              ...regPolicy,
              inviteCodes,
            },
          },
        },
      });
    }

    const initialRole = isFirstUser
      ? WhiteLabelUserRole.OWNER
      : (regPolicy.defaultRole as WhiteLabelUserRole) || WhiteLabelUserRole.CLIENT;

    const isApproved =
      whiteLabel.userSignupModel === WhiteLabelSignupModel.ADMIN_APPROVAL
        ? isFirstUser
        : true;

    const hashedPassword = await argon2.hash(dto.password, ARGON2_CONFIG);

    const userCode = await generateUniqueCode(
      this.prismaService,
      'whiteLabelUser',
      CodePrefix.WHITELABEL_USER,
    );

    let newUser;
    try {
      newUser = await this.prismaService.whiteLabelUser.create({
        data: {
          code: userCode,
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: initialRole,
          isApproved,
          whiteLabelId: whiteLabel.id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A user with this email already exists in this portal.',
        );
      }
      throw error;
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(
      REDIS_KEYS.whitelabel.user.verification.key(token),
      newUser.id,
      REDIS_KEYS.whitelabel.user.verification.ttl,
    );

    const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();

    try {
      await this.mailService.sendVerificationEmail(
        newUser.email,
        fullName,
        token,
      );
    } catch (error) {
      console.warn(
        '[WhitelabelAuthService] Verification email delivery warning:',
        error,
      );
      // Account is created; user can resend verification if needed
    }

    const pendingApproval = !newUser.isApproved;

    return {
      success: true,
      pendingApproval,
      message: pendingApproval
        ? 'Your registration has been submitted and is pending administrator approval before activation.'
        : 'Registration successful. You can now sign in to your portal account.',
      user: {
        id: newUser.id,
        code: newUser.code,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isApproved: newUser.isApproved,
      },
    };
  }

  async verify(dto: VerifyDto) {
    const userId = await this.redisService.get(
      REDIS_KEYS.whitelabel.user.verification.key(dto.token),
    );

    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    const user = await this.prismaService.whiteLabelUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(
        'User associated with this token does not exist.',
      );
    }

    await this.redisService.del(
      REDIS_KEYS.whitelabel.user.verification.key(dto.token),
    );

    return {
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    };
  }

  async resendVerification(whiteLabel: WhiteLabel, dto: ResendVerificationDto) {
    const user = await this.prismaService.whiteLabelUser.findUnique({
      where: {
        email_whiteLabelId: {
          email: dto.email,
          whiteLabelId: whiteLabel.id,
        },
      },
    });

    if (!user) {
      return {
        success: true,
        message:
          'If the email is registered, a verification link has been sent.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(
      REDIS_KEYS.whitelabel.user.verification.key(token),
      user.id,
      REDIS_KEYS.whitelabel.user.verification.ttl,
    );

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    try {
      await this.mailService.sendVerificationEmail(user.email, fullName, token);
    } catch (error) {
      console.warn('[WhitelabelAuthService] Resend email warning:', error);
    }

    return {
      success: true,
      message: 'If the email is registered, a verification link has been sent.',
    };
  }

  async login(
    whiteLabel: WhiteLabel,
    dto: LoginDto,
    clientInfo: ClientMetadata,
  ) {
    let user = await this.prismaService.whiteLabelUser.findUnique({
      where: {
        email_whiteLabelId: {
          email: dto.email,
          whiteLabelId: whiteLabel.id,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException(
        'Your account is currently pending administrator approval. Please wait for an administrator to activate your access.',
      );
    }

    // Account Lockout check
    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        throw new UnauthorizedException(
          'Your account has been locked out due to multiple failed attempts. Please try again later.',
        );
      } else {
        user = await this.prismaService.whiteLabelUser.update({
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
        'This account uses an external sign-in provider. Please sign in using your OAuth provider.',
      );
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      const nextAttempts = user.failedLoginAttempts + 1;
      const shouldLock = nextAttempts >= AUTH_MAX_FAILED_ATTEMPTS;

      await this.prismaService.whiteLabelUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextAttempts,
          ...(shouldLock && {
            lockedUntil: new Date(Date.now() + AUTH_LOCKOUT_DURATION_MS),
          }),
        },
      });

      if (shouldLock) {
        throw new UnauthorizedException(
          'Your account has been locked out for 1 hour due to too many failed attempts.',
        );
      }

      throw new UnauthorizedException('Invalid Login Credentials');
    }

    // MFA Challenge
    if (user.twoFactorEnabled) {
      try {
        const mfaCode = crypto.randomInt(100000, 999999).toString();
        const mfaToken = crypto.randomBytes(32).toString('hex');

        await this.redisService.set(
          REDIS_KEYS.whitelabel.user.mfa.key(user.id),
          mfaCode,
          REDIS_KEYS.whitelabel.user.mfa.ttl,
        );

        await this.redisService.set(
          REDIS_KEYS.whitelabel.user.mfaChallenge.key(mfaToken),
          user.id,
          REDIS_KEYS.whitelabel.user.mfaChallenge.ttl,
        );

        const fullName = `${user.firstName} ${user.lastName}`.trim();
        await this.mailService.send2faCodeEmail(user.email, fullName, mfaCode);

        await this.prismaService.whiteLabelUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0 },
        });

        return {
          requireMfa: true,
          mfaToken,
          message:
            'Two-factor authentication code sent to your registered email.',
        };
      } catch (error) {
        console.error(
          '[WhitelabelAuthService] MFA Challenge Dispatch Failure:',
          error,
        );
        throw new InternalServerErrorException(
          'Failed to dispatch two-factor authentication challenge.',
        );
      }
    }

    // Create Authenticated Session
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

      // Session expires in 7 days
      const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      const session = await this.prismaService.session.create({
        data: {
          code: sessionCode,
          token: tokenHash,
          whiteLabelUserId: user.id,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          expiresAt: sessionExpiresAt,
        },
      });

      await this.prismaService.whiteLabelUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          failedTwoFactorAttempts: 0,
          failedPasswordResetAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Signed in successfully.',
        token: rawToken,
        user: {
          id: user.id,
          code: user.code,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          sessionId: session.id,
        },
      };
    } catch (error) {
      console.error(
        '[WhitelabelAuthService] Login Session Creation Failure:',
        error,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating your session.',
      );
    }
  }

  async verifyMfa(
    whiteLabel: WhiteLabel,
    dto: VerifyMfaDto,
    clientInfo: ClientMetadata,
  ) {
    const challengedUserId = await this.redisService.get(
      REDIS_KEYS.whitelabel.user.mfaChallenge.key(dto.mfaToken),
    );

    if (!challengedUserId) {
      throw new UnauthorizedException(
        'This two-factor challenge has expired or is invalid. Please sign in again.',
      );
    }

    const user = await this.prismaService.whiteLabelUser.findUnique({
      where: { id: challengedUserId },
    });

    if (!user || user.whiteLabelId !== whiteLabel.id) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }

    const expectedCode = await this.redisService.get(
      REDIS_KEYS.whitelabel.user.mfa.key(user.id),
    );

    if (!expectedCode || !codesMatch(dto.code, expectedCode)) {
      const nextAttempts = user.failedTwoFactorAttempts + 1;
      const shouldLock = nextAttempts >= AUTH_MAX_FAILED_ATTEMPTS;

      await this.prismaService.whiteLabelUser.update({
        where: { id: user.id },
        data: {
          failedTwoFactorAttempts: nextAttempts,
          ...(shouldLock && {
            lockedUntil: new Date(Date.now() + AUTH_LOCKOUT_DURATION_MS),
          }),
        },
      });

      if (shouldLock) {
        throw new UnauthorizedException(
          'Your account has been locked out for 1 hour due to multiple invalid 2FA codes.',
        );
      }

      throw new UnauthorizedException('Invalid verification code.');
    }

    // MFA succeeded: clear redis challenge and code
    await this.redisService.del(REDIS_KEYS.whitelabel.user.mfa.key(user.id));
    await this.redisService.del(
      REDIS_KEYS.whitelabel.user.mfaChallenge.key(dto.mfaToken),
    );

    // Create session
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

    const session = await this.prismaService.session.create({
      data: {
        code: sessionCode,
        token: tokenHash,
        whiteLabelUserId: user.id,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    await this.prismaService.whiteLabelUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        failedTwoFactorAttempts: 0,
        failedPasswordResetAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Signed in successfully with two-factor authentication.',
      token: rawToken,
      user: {
        id: user.id,
        code: user.code,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sessionId: session.id,
      },
    };
  }

  async requestPasswordReset(
    whiteLabel: WhiteLabel,
    dto: RequestPasswordResetDto,
  ) {
    const user = await this.prismaService.whiteLabelUser.findUnique({
      where: {
        email_whiteLabelId: {
          email: dto.email,
          whiteLabelId: whiteLabel.id,
        },
      },
    });

    if (!user) {
      return {
        success: true,
        message:
          'If the email is registered, password reset instructions have been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(
      REDIS_KEYS.whitelabel.user.passwordReset.key(resetToken),
      user.id,
      REDIS_KEYS.whitelabel.user.passwordReset.ttl,
    );

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        fullName,
        resetToken,
      );
    } catch (error) {
      console.warn(
        '[WhitelabelAuthService] Password reset email warning:',
        error,
      );
    }

    return {
      success: true,
      message:
        'If the email is registered, password reset instructions have been sent.',
    };
  }

  async passwordReset(whiteLabel: WhiteLabel, dto: PasswordResetDto) {
    const userId = await this.redisService.get(
      REDIS_KEYS.whitelabel.user.passwordReset.key(dto.token),
    );

    if (!userId) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const user = await this.prismaService.whiteLabelUser.findUnique({
      where: { id: userId },
    });

    if (!user || user.whiteLabelId !== whiteLabel.id) {
      throw new BadRequestException(
        'User associated with this token does not exist.',
      );
    }

    const hashedPassword = await argon2.hash(dto.password, ARGON2_CONFIG);

    await this.prismaService.whiteLabelUser.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        failedTwoFactorAttempts: 0,
        failedPasswordResetAttempts: 0,
        lockedUntil: null,
      },
    });

    // Revoke all active sessions on password reset for security
    await this.prismaService.session.updateMany({
      where: {
        whiteLabelUserId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'PASSWORD_RESET_SECURITY_REVOCATION',
      },
    });

    await this.redisService.del(
      REDIS_KEYS.whitelabel.user.passwordReset.key(dto.token),
    );

    return {
      success: true,
      message:
        'Password reset successfully. Please sign in with your new password.',
    };
  }

  async logout(sessionId: string) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokeReason: 'USER_LOGOUT',
      },
    });

    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }
}
