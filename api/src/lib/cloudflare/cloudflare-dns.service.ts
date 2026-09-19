import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CloudflareDnsResult {
  success: boolean;
  message: string;
  recordId?: string;
  fqdn: string;
  configured: boolean;
}

@Injectable()
export class CloudflareDnsService {
  private readonly logger = new Logger(CloudflareDnsService.name);

  constructor(private readonly configService: ConfigService) {}

  private get apiToken(): string | undefined {
    return this.configService.get<string>('CLOUDFLARE_API_TOKEN') || process.env.CLOUDFLARE_API_TOKEN;
  }

  private get zoneId(): string | undefined {
    return this.configService.get<string>('CLOUDFLARE_ZONE_ID') || process.env.CLOUDFLARE_ZONE_ID;
  }

  private get baseDomain(): string {
    return (
      this.configService.get<string>('CLOUDFLARE_BASE_DOMAIN') ||
      process.env.CLOUDFLARE_BASE_DOMAIN ||
      'platform.royalmotionit.com'
    );
  }

  private get targetCname(): string {
    return (
      this.configService.get<string>('CLOUDFLARE_TARGET_CNAME') ||
      process.env.CLOUDFLARE_TARGET_CNAME ||
      'platform.royalmotionit.com'
    );
  }

  /**
   * Automatically provisions or updates a CNAME record on Cloudflare
   * for a WhiteLabel subdomain: [subdomain].platform.royalmotionit.com
   */
  async provisionSubdomain(subdomain: string): Promise<CloudflareDnsResult> {
    const cleanSub = subdomain.trim().toLowerCase();
    const fqdn = `${cleanSub}.${this.baseDomain}`;

    if (!this.apiToken || !this.zoneId) {
      this.logger.warn(
        `[CloudflareDnsService] CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID is not configured in environment. Subdomain ${fqdn} provisioning was simulated.`,
      );
      return {
        success: true,
        configured: false,
        message: `Cloudflare credentials not configured in .env. Automated DNS for ${fqdn} skipped in dev.`,
        fqdn,
      };
    }

    try {
      // 1. Check if a DNS record already exists for this FQDN
      const searchUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(fqdn)}&type=CNAME`;
      const searchRes = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const searchData = (await searchRes.json()) as any;
      const existingRecords = searchData?.result || [];

      if (existingRecords.length > 0) {
        const recordId = existingRecords[0].id;
        // Update existing record
        const updateRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${recordId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'CNAME',
              name: fqdn,
              content: this.targetCname,
              ttl: 1, // Auto TTL
              proxied: true, // Cloudflare SSL & DDoS protection
              comment: `Managed WhiteLabel Subdomain (${new Date().toISOString()})`,
            }),
          },
        );

        const updateData = (await updateRes.json()) as any;
        if (!updateRes.ok || !updateData?.success) {
          throw new Error(updateData?.errors?.[0]?.message || 'Failed to update CNAME record');
        }

        this.logger.log(`[CloudflareDnsService] Updated CNAME record ${fqdn} -> ${this.targetCname}`);
        return {
          success: true,
          configured: true,
          recordId,
          fqdn,
          message: `Cloudflare DNS record for ${fqdn} updated successfully.`,
        };
      }

      // 2. Create new CNAME record
      const createRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'CNAME',
            name: fqdn,
            content: this.targetCname,
            ttl: 1,
            proxied: true,
            comment: `Managed WhiteLabel Subdomain (${new Date().toISOString()})`,
          }),
        },
      );

      const createData = (await createRes.json()) as any;
      if (!createRes.ok || !createData?.success) {
        throw new Error(createData?.errors?.[0]?.message || 'Failed to create CNAME record');
      }

      const newRecordId = createData?.result?.id;
      this.logger.log(`[CloudflareDnsService] Created CNAME record ${fqdn} -> ${this.targetCname} (ID: ${newRecordId})`);

      return {
        success: true,
        configured: true,
        recordId: newRecordId,
        fqdn,
        message: `Cloudflare DNS record ${fqdn} created with automated SSL.`,
      };
    } catch (error: any) {
      const errMsg = error.message || 'Unknown Cloudflare API error';
      this.logger.error(`[CloudflareDnsService] Failed to provision ${fqdn}: ${errMsg}`);

      return {
        success: false,
        configured: true,
        message: `Cloudflare DNS provisioning error: ${errMsg}`,
        fqdn,
      };
    }
  }

  /**
   * Deprovisions or deletes the CNAME record when a tenant is deleted or subdomain changed
   */
  async deprovisionSubdomain(subdomain: string): Promise<{ success: boolean; message: string }> {
    const cleanSub = subdomain.trim().toLowerCase();
    const fqdn = `${cleanSub}.${this.baseDomain}`;

    if (!this.apiToken || !this.zoneId) {
      return { success: true, message: 'Cloudflare not configured, skipped.' };
    }

    try {
      const searchUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(fqdn)}&type=CNAME`;
      const searchRes = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const searchData = (await searchRes.json()) as any;
      const existingRecords = searchData?.result || [];
      if (existingRecords.length > 0) {
        const recordId = existingRecords[0].id;
        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${recordId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
            },
          },
        );
        this.logger.log(`[CloudflareDnsService] Deleted CNAME record for ${fqdn}`);
      }

      return { success: true, message: `DNS record for ${fqdn} removed.` };
    } catch (error: any) {
      this.logger.warn(`[CloudflareDnsService] Failed to delete DNS record for ${fqdn}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
