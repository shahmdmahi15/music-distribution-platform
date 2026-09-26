import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from 'src/lib/storage/storage.service';
import { RedisService } from 'src/lib/redis/redis.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { WhiteLabel } from 'src/generated/prisma/client';
import {
  WhiteLabelStatus,
  WhiteLabelUserRole,
  WhiteLabelSignupModel,
} from 'src/generated/prisma/enums';
import { WhitelabelSetupDto } from './dto/whitelabel-setup.dto';
import * as argon2 from 'argon2';
import { ARGON2_CONFIG } from 'src/config/argon2.config';
import { generateUniqueCode, CodePrefix } from 'src/lib/prisma/code-generator';

@Injectable()
export class WhitelabelTenantService {
  constructor(
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  private resolveUrl(keyOrUrl: string | null | undefined): string | null {
    if (!keyOrUrl) return null;
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      return keyOrUrl;
    }
    return this.storageService.getFileUrl(keyOrUrl);
  }

  async getPublicBranding(whiteLabel: WhiteLabel) {
    // 1. Check Redis Cached Theme Customization
    const cachedTheme = await this.redisService.get(
      `whitelabel:config:${whiteLabel.id}:theme`,
    );
    const themeMeta = cachedTheme ? JSON.parse(cachedTheme) : null;

    // 2. Check Redis Cached SSO & Security Policies
    const cachedSso = await this.redisService.get(
      `whitelabel:config:${whiteLabel.id}:sso`,
    );
    const ssoMeta = cachedSso ? JSON.parse(cachedSso) : null;

    // 3. Check Domain Status
    const cachedDomain = await this.redisService.get(
      `whitelabel:config:${whiteLabel.id}:domain_status`,
    );
    const domainStatus = cachedDomain ? JSON.parse(cachedDomain) : null;

    // 4. Check if tenant has an Owner user provisioned
    const ownerCount = await this.prismaService.whiteLabelUser.count({
      where: {
        whiteLabelId: whiteLabel.id,
        role: WhiteLabelUserRole.OWNER,
      },
    });
    const hasOwner = ownerCount > 0;

    const isConfigured = Boolean(
      whiteLabel.isSetupComplete &&
      whiteLabel.status === WhiteLabelStatus.ACTIVE &&
      whiteLabel.name &&
      whiteLabel.name.trim() !== '',
    );

    return {
      success: true,
      message: 'Tenant branding & full configuration retrieved successfully',
      tenant: {
        id: whiteLabel.id,
        code: whiteLabel.code,
        name: whiteLabel.name,
        subdomain: whiteLabel.subdomain,
        customDomain: whiteLabel.customDomain,
        tagline: whiteLabel.tagline,
        description: whiteLabel.description,
        logoUrl: this.resolveUrl(whiteLabel.logoUrl),
        logoDarkUrl: this.resolveUrl(whiteLabel.logoDarkUrl),
        faviconUrl: this.resolveUrl(whiteLabel.faviconUrl),
        bannerUrl: this.resolveUrl(whiteLabel.bannerUrl),
        primaryColor:
          whiteLabel.primaryColor || themeMeta?.primaryColor || '#6366f1',
        accentColor:
          whiteLabel.accentColor || themeMeta?.accentColor || '#ec4899',
        themeRadius:
          whiteLabel.themeRadius || themeMeta?.radius || '0.5rem',
        themeFont:
          whiteLabel.themeFont || themeMeta?.fontFamily || 'Inter',
        themeMode:
          whiteLabel.themeMode || themeMeta?.mode || 'dark',
        navbarStyle:
          whiteLabel.navbarStyle || themeMeta?.navbarStyle || 'glass',
        cardStyle:
          whiteLabel.cardStyle || themeMeta?.cardStyle || 'modern',
        supportEmail: whiteLabel.supportEmail,
        supportPhone: whiteLabel.supportPhone,
        copyrightText:
          whiteLabel.copyrightText ||
          (whiteLabel.name
            ? `© ${new Date().getFullYear()} ${whiteLabel.name}. All rights reserved.`
            : null),
        socials: {
          instagram: whiteLabel.socialInstagram,
          twitter: whiteLabel.socialTwitter,
          youtube: whiteLabel.socialYoutube,
          spotify: whiteLabel.socialSpotify,
          facebook: whiteLabel.socialFacebook,
          linkedin: whiteLabel.socialLinkedin,
          tiktok: whiteLabel.socialTiktok,
        },
        userSignupModel: whiteLabel.userSignupModel,
        businessType: whiteLabel.businessType,
        country: whiteLabel.country,
        status: whiteLabel.status,
        onboardingDetails: whiteLabel.onboardingDetails,
        permissions: {
          fullAccess: true,
          tenantScope: whiteLabel.id,
          role: 'OWNER',
          scopes: ['*'],
          features: {
            catalogManagement: true,
            userManagement: true,
            royaltyAnalytics: true,
            themeCustomization: true,
            directDistribution: whiteLabel.businessType !== 'REFERRER',
            // Global Music Distribution & Aggregator Standards
            subLabelMultiTenancy: whiteLabel.businessType === 'DISTRIBUTOR_AGGREGATOR',
            ddexIngestionPipeline: whiteLabel.businessType === 'DISTRIBUTOR_AGGREGATOR',
            antiFraudQualityControl: whiteLabel.businessType === 'DISTRIBUTOR_AGGREGATOR',
            // Global Referrer & Talent Scout Network Standards
            referralLinkGenerator: whiteLabel.businessType === 'REFERRER',
            affiliateCommissionLedger: whiteLabel.businessType === 'REFERRER',
            pipelineAnalytics: whiteLabel.businessType === 'REFERRER',
          },
        },
        theme: {
          primaryColor:
            whiteLabel.primaryColor || themeMeta?.primaryColor || '#6366f1',
          accentColor:
            whiteLabel.accentColor || themeMeta?.accentColor || '#ec4899',
          radius: whiteLabel.themeRadius || themeMeta?.radius || '0.5rem',
          mode: whiteLabel.themeMode || themeMeta?.mode || 'dark',
          fontFamily: whiteLabel.themeFont || themeMeta?.fontFamily || 'Inter',
          cardStyle: whiteLabel.cardStyle || themeMeta?.cardStyle || 'modern',
          navbarStyle:
            whiteLabel.navbarStyle || themeMeta?.navbarStyle || 'glass',
        },
        sso: {
          userSignupModel: whiteLabel.userSignupModel,
          googleEnabled:
            whiteLabel.ssoGoogleEnabled ?? ssoMeta?.googleEnabled ?? true,
          githubEnabled:
            whiteLabel.ssoGithubEnabled ?? ssoMeta?.githubEnabled ?? false,
          enforce2fa: whiteLabel.ssoEnforce2fa ?? ssoMeta?.enforce2fa ?? false,
          sessionTimeoutHours:
            whiteLabel.ssoSessionTimeoutHours ||
            ssoMeta?.sessionTimeoutHours ||
            72,
        },
        domain: {
          subdomain: whiteLabel.subdomain,
          platformSubdomainFqdn: whiteLabel.subdomain
            ? `${whiteLabel.subdomain}.platform.royalmotionit.com`
            : null,
          customDomain: whiteLabel.customDomain,
          cnameTarget: whiteLabel.subdomain
            ? `${whiteLabel.subdomain}.platform.royalmotionit.com`
            : 'platform.royalmotionit.com',
          verified:
            whiteLabel.domainVerified || domainStatus?.verified || false,
          sslStatus:
            whiteLabel.domainSslStatus ||
            domainStatus?.sslStatus ||
            'NOT_CONFIGURED',
        },
        isConfigured,
        isSetupComplete: whiteLabel.isSetupComplete,
        hasOwner,
        brandingConfigured: Boolean(
          whiteLabel.name && whiteLabel.name.trim() !== '',
        ),
      },
    };
  }

  async completeSetup(whiteLabel: WhiteLabel, dto: WhitelabelSetupDto) {
    // 1. Initial Owner Account Creation if requested & no owner exists
    if (dto.ownerEmail && dto.ownerPassword) {
      const existingOwner = await this.prismaService.whiteLabelUser.findFirst({
        where: {
          whiteLabelId: whiteLabel.id,
          role: WhiteLabelUserRole.OWNER,
        },
      });

      if (!existingOwner) {
        const hashedPassword = (
          await argon2.hash(dto.ownerPassword, ARGON2_CONFIG)
        ).toString();
        const userCode = await generateUniqueCode(
          this.prismaService,
          'whiteLabelUser',
          CodePrefix.WHITELABEL_USER,
        );

        await this.prismaService.whiteLabelUser.create({
          data: {
            code: userCode,
            email: dto.ownerEmail.trim().toLowerCase(),
            passwordHash: hashedPassword,
            firstName: dto.ownerFirstName?.trim() || 'Portal',
            lastName: dto.ownerLastName?.trim() || 'Owner',
            role: WhiteLabelUserRole.OWNER,
            isApproved: true,
            whiteLabelId: whiteLabel.id,
          },
        });
      }
    }

    // 2. Persist All Setup Configuration into Platform API Database
    const updated = await this.prismaService.whiteLabel.update({
      where: { id: whiteLabel.id },
      data: {
        name: dto.name.trim(),
        tagline: dto.tagline?.trim() || null,
        description: dto.description?.trim() || null,
        supportEmail: dto.supportEmail.trim().toLowerCase(),
        supportPhone: dto.supportPhone?.trim() || null,
        copyrightText:
          dto.copyrightText?.trim() ||
          `© ${new Date().getFullYear()} ${dto.name.trim()}. All rights reserved.`,
        primaryColor: dto.primaryColor || '#6366f1',
        accentColor: dto.accentColor || '#ec4899',
        themeRadius: dto.themeRadius || '0.5rem',
        themeFont: dto.themeFont || 'Inter',
        themeMode: dto.themeMode || 'dark',
        cardStyle: dto.cardStyle || 'modern',
        navbarStyle: dto.navbarStyle || 'glass',
        userSignupModel:
          dto.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
        logoUrl: dto.logoUrl?.trim() || null,
        logoDarkUrl: dto.logoDarkUrl?.trim() || null,
        faviconUrl: dto.faviconUrl?.trim() || null,
        bannerUrl: dto.bannerUrl?.trim() || null,
        socialInstagram: dto.socialInstagram?.trim() || null,
        socialTwitter: dto.socialTwitter?.trim() || null,
        socialYoutube: dto.socialYoutube?.trim() || null,
        socialSpotify: dto.socialSpotify?.trim() || null,
        socialFacebook: dto.socialFacebook?.trim() || null,
        socialLinkedin: dto.socialLinkedin?.trim() || null,
        socialTiktok: dto.socialTiktok?.trim() || null,
        isSetupComplete: true,
        status: WhiteLabelStatus.ACTIVE,
      },
    });

    // 3. Cache Theme in Redis for Sub-Millisecond SSR Resolution
    await this.redisService.set(
      `whitelabel:config:${whiteLabel.id}:theme`,
      JSON.stringify({
        primaryColor: updated.primaryColor,
        accentColor: updated.accentColor,
        radius: updated.themeRadius,
        mode: updated.themeMode,
        fontFamily: updated.themeFont,
        cardStyle: updated.cardStyle,
        navbarStyle: updated.navbarStyle,
      }),
    );

    // 4. Cache SSO Policy in Redis
    await this.redisService.set(
      `whitelabel:config:${whiteLabel.id}:sso`,
      JSON.stringify({
        userSignupModel: updated.userSignupModel,
        googleEnabled: updated.ssoGoogleEnabled,
        githubEnabled: updated.ssoGithubEnabled,
        enforce2fa: updated.ssoEnforce2fa,
        sessionTimeoutHours: updated.ssoSessionTimeoutHours,
      }),
    );

    const brandingResult = await this.getPublicBranding(updated);
    return {
      success: true,
      message:
        'WhiteLabel portal setup completed successfully and saved to database.',
      tenant: brandingResult.tenant,
    };
  }
}
