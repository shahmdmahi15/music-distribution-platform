import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CustomHostnameSslSettings {
  min_tls_version?: '1.0' | '1.1' | '1.2' | '1.3';
  http2?: 'on' | 'off';
  http3?: 'on' | 'off';
  tls_1_3?: 'on' | 'off';
  ciphers?: string[];
}

export interface CustomHostnameSslRecord {
  status:
    | 'initializing'
    | 'pending_validation'
    | 'pending_issuance'
    | 'pending_deployment'
    | 'active'
    | 'cancelled'
    | 'timed_out'
    | 'expired';
  method: 'http' | 'txt' | 'email';
  type: 'dv';
  settings?: CustomHostnameSslSettings;
  validation_records?: Array<{
    status?: string;
    txt_name?: string;
    txt_value?: string;
    http_url?: string;
    http_body?: string;
  }>;
  validation_errors?: Array<{ message: string }>;
  certificate_authority?: string;
}

export interface CustomHostnameOwnershipVerification {
  type: 'txt' | 'http';
  name: string;
  value: string;
}

export interface CustomHostnameResult {
  id: string;
  hostname: string;
  status:
    'active' | 'pending' | 'pending_migration' | 'blocked' | 'provisioned';
  ssl: CustomHostnameSslRecord;
  ownership_verification?: CustomHostnameOwnershipVerification;
  ownership_verification_http?: { http_url: string; http_body: string };
  custom_origin_server?: string;
  custom_metadata?: Record<string, any>;
  created_at: string;
}

export interface SaasProvisioningResult {
  success: boolean;
  message: string;
  hostname: string;
  customHostnameId?: string;
  status?: string;
  sslStatus?: string;
  cnameTarget: string;
  verification?: {
    ownershipRecord?: { name: string; value: string; type: string };
    sslValidationRecord?: { name: string; value: string; type: string };
  };
  raw?: CustomHostnameResult;
  simulated?: boolean;
}

export interface TenantDnsInstructions {
  hostname: string;
  cnameRecord: {
    type: 'CNAME';
    host: string;
    value: string;
    ttl: string;
    purpose: string;
  };
  ownershipTxtRecord?: {
    type: 'TXT';
    host: string;
    value: string;
    purpose: string;
  };
  sslTxtRecord?: {
    type: 'TXT';
    host: string;
    value: string;
    purpose: string;
  };
}

@Injectable()
export class CloudflareSaasService {
  private readonly logger = new Logger(CloudflareSaasService.name);

  constructor(private readonly configService: ConfigService) {}

  private get apiToken(): string | undefined {
    return (
      this.configService.get<string>('CLOUDFLARE_API_TOKEN') ||
      process.env.CLOUDFLARE_API_TOKEN
    );
  }

  private get zoneId(): string | undefined {
    return (
      this.configService.get<string>('CLOUDFLARE_ZONE_ID') ||
      process.env.CLOUDFLARE_ZONE_ID
    );
  }

  private get fallbackOrigin(): string {
    return (
      this.configService.get<string>('CLOUDFLARE_FALLBACK_ORIGIN') ||
      process.env.CLOUDFLARE_FALLBACK_ORIGIN ||
      this.configService.get<string>('CLOUDFLARE_TARGET_CNAME') ||
      process.env.CLOUDFLARE_TARGET_CNAME ||
      'platform.royalmotionit.com'
    );
  }

  /**
   * Provisions a custom hostname on Cloudflare for SaaS (/zones/{zone_id}/custom_hostnames)
   * with automated SSL/TLS certificate generation (DV).
   */
  async provisionCustomHostname(
    hostname: string,
    customOriginServer?: string,
  ): Promise<SaasProvisioningResult> {
    const cleanHostname = hostname.trim().toLowerCase();
    const originTarget = customOriginServer?.trim() || this.fallbackOrigin;

    if (!this.apiToken || !this.zoneId) {
      this.logger.warn(
        `[CloudflareSaasService] CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID missing. Simulating SaaS hostname for ${cleanHostname}`,
      );
      return {
        success: true,
        configured: false,
        simulated: true,
        hostname: cleanHostname,
        customHostnameId: `sim_${Date.now()}`,
        status: 'pending',
        sslStatus: 'pending_validation',
        cnameTarget: originTarget,
        message: `Cloudflare SaaS custom hostname simulated for ${cleanHostname}. Point CNAME to ${originTarget}.`,
        verification: {
          ownershipRecord: {
            type: 'TXT',
            name: `_cf-custom-hostname.${cleanHostname}`,
            value: `sim_token_${Date.now()}`,
          },
        },
      } as SaasProvisioningResult;
    }

    try {
      // 1. Check if the custom hostname already exists
      const existing = await this.findCustomHostnameByName(cleanHostname);
      if (existing?.customHostnameId) {
        this.logger.log(
          `[CloudflareSaasService] Custom hostname ${cleanHostname} already exists (ID: ${existing.customHostnameId})`,
        );
        return existing;
      }

      // 2. Create Custom Hostname via Cloudflare API
      const endpoint = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames`;
      const payload = {
        hostname: cleanHostname,
        ssl: {
          method: 'txt',
          type: 'dv',
          settings: {
            min_tls_version: '1.2',
            http2: 'on',
            tls_1_3: 'on',
          },
        },
        custom_origin_server: originTarget,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        const errorMsg =
          data?.errors?.[0]?.message || 'Failed to provision custom hostname';
        this.logger.error(
          `[CloudflareSaasService] Cloudflare for SaaS API error for ${cleanHostname}: ${errorMsg}`,
        );
        return {
          success: false,
          hostname: cleanHostname,
          cnameTarget: originTarget,
          message: `Cloudflare for SaaS error: ${errorMsg}`,
        };
      }

      const item: CustomHostnameResult = data.result;
      const ownership = item.ownership_verification;
      const sslRecord = item.ssl?.validation_records?.[0];

      return {
        success: true,
        hostname: cleanHostname,
        customHostnameId: item.id,
        status: item.status,
        sslStatus: item.ssl?.status,
        cnameTarget: originTarget,
        message: `Custom hostname ${cleanHostname} created on Cloudflare for SaaS. Automated SSL issued.`,
        verification: {
          ownershipRecord: ownership
            ? {
                type: 'TXT',
                name: ownership.name,
                value: ownership.value,
              }
            : undefined,
          sslValidationRecord: sslRecord
            ? {
                type: 'TXT',
                name: sslRecord.txt_name || `_acme-challenge.${cleanHostname}`,
                value: sslRecord.txt_value || '',
              }
            : undefined,
        },
        raw: item,
      };
    } catch (error: any) {
      this.logger.error(
        `[CloudflareSaasService] Unexpected error provisioning ${cleanHostname}: ${error.message}`,
      );
      return {
        success: false,
        hostname: cleanHostname,
        cnameTarget: originTarget,
        message: `Exception during SaaS custom hostname provisioning: ${error.message}`,
      };
    }
  }

  /**
   * Search for an existing custom hostname by FQDN
   */
  async findCustomHostnameByName(
    hostname: string,
  ): Promise<SaasProvisioningResult | null> {
    const cleanHostname = hostname.trim().toLowerCase();

    if (!this.apiToken || !this.zoneId) {
      return null;
    }

    try {
      const endpoint = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames?hostname=${encodeURIComponent(cleanHostname)}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      const list: CustomHostnameResult[] = data?.result || [];

      if (!list || list.length === 0) {
        return null;
      }

      const item = list[0];
      const ownership = item.ownership_verification;
      const sslRecord = item.ssl?.validation_records?.[0];

      return {
        success: true,
        hostname: cleanHostname,
        customHostnameId: item.id,
        status: item.status,
        sslStatus: item.ssl?.status,
        cnameTarget: item.custom_origin_server || this.fallbackOrigin,
        message: `Custom hostname ${cleanHostname} found. Status: ${item.status}. SSL: ${item.ssl?.status}.`,
        verification: {
          ownershipRecord: ownership
            ? {
                type: 'TXT',
                name: ownership.name,
                value: ownership.value,
              }
            : undefined,
          sslValidationRecord: sslRecord
            ? {
                type: 'TXT',
                name: sslRecord.txt_name || `_acme-challenge.${cleanHostname}`,
                value: sslRecord.txt_value || '',
              }
            : undefined,
        },
        raw: item,
      };
    } catch (error: any) {
      this.logger.warn(
        `[CloudflareSaasService] Query error for ${cleanHostname}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get custom hostname details by ID
   */
  async getCustomHostname(
    customHostnameId: string,
  ): Promise<SaasProvisioningResult> {
    if (!this.apiToken || !this.zoneId) {
      return {
        success: true,
        simulated: true,
        hostname: 'simulated.domain',
        customHostnameId,
        cnameTarget: this.fallbackOrigin,
        status: 'active',
        sslStatus: 'active',
        message: 'Cloudflare SaaS not configured, simulated active.',
      };
    }

    try {
      const endpoint = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames/${customHostnameId}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.errors?.[0]?.message ||
            'Failed to fetch custom hostname details',
        );
      }

      const item: CustomHostnameResult = data.result;
      const ownership = item.ownership_verification;
      const sslRecord = item.ssl?.validation_records?.[0];

      return {
        success: true,
        hostname: item.hostname,
        customHostnameId: item.id,
        status: item.status,
        sslStatus: item.ssl?.status,
        cnameTarget: item.custom_origin_server || this.fallbackOrigin,
        message: `Custom hostname ${item.hostname} fetched.`,
        verification: {
          ownershipRecord: ownership
            ? {
                type: 'TXT',
                name: ownership.name,
                value: ownership.value,
              }
            : undefined,
          sslValidationRecord: sslRecord
            ? {
                type: 'TXT',
                name: sslRecord.txt_name || `_acme-challenge.${item.hostname}`,
                value: sslRecord.txt_value || '',
              }
            : undefined,
        },
        raw: item,
      };
    } catch (error: any) {
      return {
        success: false,
        hostname: '',
        customHostnameId,
        cnameTarget: this.fallbackOrigin,
        message: error.message,
      };
    }
  }

  /**
   * Deprovisions and deletes a custom hostname from Cloudflare for SaaS
   */
  async deprovisionCustomHostname(
    customHostnameIdOrName: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.apiToken || !this.zoneId) {
      return {
        success: true,
        message: 'Cloudflare SaaS not configured, skipped.',
      };
    }

    try {
      let hostnameId = customHostnameIdOrName;
      if (customHostnameIdOrName.includes('.')) {
        const found = await this.findCustomHostnameByName(
          customHostnameIdOrName,
        );
        if (!found?.customHostnameId) {
          return {
            success: true,
            message: `Custom hostname ${customHostnameIdOrName} not found in SaaS zone.`,
          };
        }
        hostnameId = found.customHostnameId;
      }

      const endpoint = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames/${hostnameId}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.errors?.[0]?.message || 'Failed to delete custom hostname',
        );
      }

      this.logger.log(
        `[CloudflareSaasService] Deleted custom hostname ID: ${hostnameId}`,
      );
      return {
        success: true,
        message: `Custom hostname ${customHostnameIdOrName} deleted successfully.`,
      };
    } catch (error: any) {
      this.logger.error(
        `[CloudflareSaasService] Error deleting custom hostname: ${error.message}`,
      );
      return { success: false, message: error.message };
    }
  }

  /**
   * Generates formatted DNS setup instructions for tenant administrators
   */
  async getTenantDnsInstructions(
    hostname: string,
    customOriginServer?: string,
  ): Promise<TenantDnsInstructions> {
    const cleanHostname = hostname.trim().toLowerCase();
    const target = customOriginServer || this.fallbackOrigin;
    const details = await this.findCustomHostnameByName(cleanHostname);

    return {
      hostname: cleanHostname,
      cnameRecord: {
        type: 'CNAME',
        host: cleanHostname,
        value: target,
        ttl: 'Auto / 300',
        purpose: 'Traffic routing & edge TLS termination',
      },
      ownershipTxtRecord: details?.verification?.ownershipRecord
        ? {
            type: 'TXT',
            host: details.verification.ownershipRecord.name,
            value: details.verification.ownershipRecord.value,
            purpose: 'Cloudflare domain ownership validation',
          }
        : undefined,
      sslTxtRecord: details?.verification?.sslValidationRecord
        ? {
            type: 'TXT',
            host: details.verification.sslValidationRecord.name,
            value: details.verification.sslValidationRecord.value,
            purpose: 'Automated SSL/TLS certificate validation (DV)',
          }
        : undefined,
    };
  }
}
