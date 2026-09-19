import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/lib/storage/storage.service';
import { RedisService } from 'src/lib/redis/redis.service';
import { WhiteLabel } from 'src/generated/prisma/client';

@Injectable()
export class WhitelabelTenantService {
  constructor(
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
  ) {}

  private resolveUrl(keyOrUrl: string | null | undefined): string | null {
    if (!keyOrUrl) return null;
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      return keyOrUrl;
    }
    return this.storageService.getFileUrl(keyOrUrl);
  }

  async getPublicBranding(whiteLabel: WhiteLabel) {
    const cachedTheme = await this.redisService.get(
      `whitelabel:config:${whiteLabel.id}:theme`,
    );
    const themeMeta = cachedTheme ? JSON.parse(cachedTheme) : null;

    const cachedSso = await this.redisService.get(
      `whitelabel:config:${whiteLabel.id}:sso`,
    );
    const ssoMeta = cachedSso ? JSON.parse(cachedSso) : null;

    const cachedDomain = await this.redisService.get(
      `whitelabel:config:${whiteLabel.id}:domain_status`,
    );
    const domainStatus = cachedDomain ? JSON.parse(cachedDomain) : null;

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
        primaryColor: themeMeta?.primaryColor || whiteLabel.primaryColor || '#6366f1',
        accentColor: themeMeta?.accentColor || whiteLabel.accentColor || '#ec4899',
        supportEmail: whiteLabel.supportEmail,
        supportPhone: whiteLabel.supportPhone,
        copyrightText: whiteLabel.copyrightText,
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
            directDistribution: true,
          },
        },
        theme: {
          primaryColor: themeMeta?.primaryColor || whiteLabel.primaryColor || '#6366f1',
          accentColor: themeMeta?.accentColor || whiteLabel.accentColor || '#ec4899',
          radius: themeMeta?.radius || whiteLabel.themeRadius || '0.5rem',
          mode: themeMeta?.mode || whiteLabel.themeMode || 'dark',
          fontFamily: themeMeta?.fontFamily || whiteLabel.themeFont || 'Inter',
          cardStyle: themeMeta?.cardStyle || whiteLabel.cardStyle || 'modern',
          navbarStyle: themeMeta?.navbarStyle || whiteLabel.navbarStyle || 'glass',
        },
        sso: {
          userSignupModel: whiteLabel.userSignupModel,
          googleEnabled: whiteLabel.ssoGoogleEnabled ?? ssoMeta?.googleEnabled ?? true,
          githubEnabled: whiteLabel.ssoGithubEnabled ?? ssoMeta?.githubEnabled ?? false,
          enforce2fa: whiteLabel.ssoEnforce2fa ?? ssoMeta?.enforce2fa ?? false,
          sessionTimeoutHours: whiteLabel.ssoSessionTimeoutHours || ssoMeta?.sessionTimeoutHours || 72,
        },
        domain: {
          subdomain: whiteLabel.subdomain,
          platformSubdomainFqdn: whiteLabel.subdomain
            ? `${whiteLabel.subdomain}.platform.royalmotionit.com`
            : null,
          customDomain: whiteLabel.customDomain,
          cnameTarget: 'cname.whitelabel.royalmotionit.com',
          verified: whiteLabel.domainVerified || domainStatus?.verified || false,
          sslStatus: whiteLabel.domainSslStatus || domainStatus?.sslStatus || 'NOT_CONFIGURED',
        },
        isConfigured: Boolean(
          whiteLabel.status === 'APPROVED' &&
          whiteLabel.name &&
          whiteLabel.name.trim() !== ''
        ),
        brandingConfigured: Boolean(
          whiteLabel.name &&
          whiteLabel.name.trim() !== ''
        ),
      },
    };
  }
}


