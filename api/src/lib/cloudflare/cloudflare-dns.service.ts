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
   * Determines whether WhiteLabel platform subdomains should be proxied (Orange Cloud)
   * or DNS-only (Grey Cloud).
   * Multi-level subdomains (*.platform.royalmotionit.com) are NOT covered by Cloudflare's
   * free 1-level wildcard (*.royalmotionit.com) Universal SSL certificate.
   * Defaulting to DNS-only (false) avoids the Cloudflare "hostname not covered by certificate"
   * warning and SSL handshake errors, allowing the origin server or tenant custom domain
   * to terminate TLS cleanly. Can be overridden via CLOUDFLARE_SUBDOMAIN_PROXIED=true.
   */
  private get shouldProxySubdomain(): boolean {
    const configured =
      this.configService.get<string>('CLOUDFLARE_SUBDOMAIN_PROXIED') ||
      process.env.CLOUDFLARE_SUBDOMAIN_PROXIED;
    if (configured !== undefined && configured !== '') {
      return configured.toLowerCase() === 'true';
    }
    return false;
  }

  /**
   * Checks whether a given subdomain is completely empty (no DNS records)
   * in Cloudflare DNS for the base domain.
   */
  async isSubdomainEmpty(subdomain: string): Promise<boolean> {
    const cleanSub = subdomain.trim().toLowerCase();
    const fqdn = `${cleanSub}.${this.baseDomain}`;

    if (!this.apiToken || !this.zoneId) {
      // In dev or unconfigured environment, treat as empty so local dev continues smoothly
      return true;
    }

    try {
      const searchUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(fqdn)}`;
      const searchRes = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const searchData = (await searchRes.json()) as any;
      const records = searchData?.result || [];
      return records.length === 0;
    } catch (error: any) {
      this.logger.warn(
        `[CloudflareDnsService] Error checking DNS record for ${fqdn}: ${error.message}`,
      );
      return true;
    }
  }

  /**
   * Checks whether an IPv4 target is eligible for Cloudflare proxying (Orange Cloud).
   * Cloudflare strictly rejects proxying to:
   * - 0.0.0.0/8 (including 0.0.0.0)
   * - 1.1.1.0/24 & 1.0.0.0/24 (Cloudflare's own public DNS resolvers)
   * - 127.0.0.0/8 (loopback addresses)
   * - 169.254.0.0/16 (link-local)
   * - 224.0.0.0/4 and above (multicast, broadcast 255.255.255.255, and reserved)
   * - RFC 1918 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
   */
  private isIpProxyable(ip: string): boolean {
    const trimmed = ip.trim();
    if (!trimmed) return false;

    // 0.0.0.0/8
    if (trimmed === '0.0.0.0' || trimmed.startsWith('0.')) {
      return false;
    }

    // Loopback 127.0.0.0/8
    if (trimmed.startsWith('127.')) {
      return false;
    }

    // Cloudflare public DNS resolvers
    if (
      trimmed === '1.1.1.1' ||
      trimmed === '1.0.0.1' ||
      trimmed === '1.1.1.2' ||
      trimmed === '1.0.0.2' ||
      trimmed === '1.1.1.3' ||
      trimmed === '1.0.0.3'
    ) {
      return false;
    }

    // Broadcast
    if (trimmed === '255.255.255.255') {
      return false;
    }

    // Link-local 169.254.0.0/16
    if (trimmed.startsWith('169.254.')) {
      return false;
    }

    // RFC 1918 private ranges
    if (trimmed.startsWith('10.') || trimmed.startsWith('192.168.')) {
      return false;
    }
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed)) {
      return false;
    }

    // Multicast & Reserved (>= 224)
    const firstOctet = parseInt(trimmed.split('.')[0], 10);
    if (!isNaN(firstOctet) && firstOctet >= 224) {
      return false;
    }

    return true;
  }

  /**
   * Helper that executes Cloudflare DNS record creation/update with automatic
   * fallback to unproxied (DNS-only) mode if Cloudflare rejects proxying for the target.
   */
  private async executeDnsSave(
    url: string,
    method: 'POST' | 'PUT',
    payload: {
      type: string;
      name: string;
      content: string;
      ttl: number;
      proxied: boolean;
      comment: string;
    },
  ): Promise<{ ok: boolean; data: any; proxied: boolean }> {
    const currentPayload = { ...payload };

    let res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentPayload),
    });

    let data = (await res.json()) as any;

    // Check if Cloudflare rejected proxying (code 1004 or message mentioning "not allowed for a proxied record")
    const errMessage: string = data?.errors?.[0]?.message || '';
    const isProxyRejected =
      currentPayload.proxied &&
      (!res.ok || !data?.success) &&
      (data?.errors?.[0]?.code === 1004 ||
        errMessage.toLowerCase().includes('not allowed for a proxied record') ||
        errMessage.toLowerCase().includes('cannot be proxied') ||
        errMessage.toLowerCase().includes('proxied'));

    if (isProxyRejected) {
      this.logger.warn(
        `[CloudflareDnsService] Target ${currentPayload.content} cannot be proxied by Cloudflare: "${errMessage}". Retrying with DNS-only mode (proxied: false)...`,
      );

      currentPayload.proxied = false;
      currentPayload.comment = `${currentPayload.comment} [DNS-only fallback]`;

      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentPayload),
      });

      data = (await res.json()) as any;
    }

    return {
      ok: res.ok && Boolean(data?.success),
      data,
      proxied: currentPayload.proxied,
    };
  }

  /**
   * Automatically provisions or updates a DNS record on Cloudflare
   * for a WhiteLabel subdomain: [subdomain].platform.royalmotionit.com
   * If elasticIpv4 is provided, provisions an 'A' record pointing to the hosted server IP.
   * Otherwise provisions a CNAME record.
   */
  async provisionSubdomain(
    subdomain: string,
    elasticIpv4?: string,
  ): Promise<CloudflareDnsResult> {
    const cleanSub = subdomain.trim().toLowerCase();
    const fqdn = `${cleanSub}.${this.baseDomain}`;
    const cleanIp = elasticIpv4?.trim();
    const isIpRouting = Boolean(
      cleanIp && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanIp),
    );

    const recordType = isIpRouting ? 'A' : 'CNAME';
    const recordContent = isIpRouting ? cleanIp! : this.targetCname;
    const initialShouldProxy =
      this.shouldProxySubdomain &&
      (isIpRouting ? this.isIpProxyable(recordContent) : true);

    if (!this.apiToken || !this.zoneId) {
      this.logger.warn(
        `[CloudflareDnsService] CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID is not configured in environment. Subdomain ${fqdn} provisioning was simulated.`,
      );
      return {
        success: true,
        configured: false,
        message: `Cloudflare credentials not configured in .env. Automated DNS for ${fqdn} (${recordType} -> ${recordContent}) simulated in dev.`,
        fqdn,
      };
    }

    try {
      // 1. Check if ANY DNS record already exists for this FQDN (CNAME or A)
      const searchUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(fqdn)}`;
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
        const record = existingRecords[0];
        const recordId = record.id;

        // If it already matches type, content, and proxy status, return directly
        if (
          record.type === recordType &&
          record.content === recordContent &&
          Boolean(record.proxied) === Boolean(initialShouldProxy)
        ) {
          const modeLabel = record.proxied ? 'Proxied (SSL & CDN)' : 'DNS-only';
          return {
            success: true,
            configured: true,
            recordId,
            fqdn,
            message: `Cloudflare DNS ${recordType} record for ${fqdn} is already active and pointing to ${recordContent} [${modeLabel}].`,
          };
        }

        // Update existing record with automatic fallback if proxying is rejected
        const updateUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${recordId}`;
        const saveResult = await this.executeDnsSave(updateUrl, 'PUT', {
          type: recordType,
          name: fqdn,
          content: recordContent,
          ttl: 1, // Auto TTL
          proxied: initialShouldProxy,
          comment: `Managed WhiteLabel Subdomain (${recordType} -> ${recordContent}) (${new Date().toISOString()})`,
        });

        if (!saveResult.ok) {
          const errMsg =
            saveResult.data?.errors?.[0]?.message ||
            `Failed to update ${recordType} record in Cloudflare`;
          throw new Error(errMsg);
        }

        const modeLabel = saveResult.proxied
          ? 'Proxied (SSL & DDoS protection)'
          : 'DNS-only';
        this.logger.log(
          `[CloudflareDnsService] Updated ${recordType} record ${fqdn} -> ${recordContent} [${modeLabel}]`,
        );

        return {
          success: true,
          configured: true,
          recordId,
          fqdn,
          message: `Cloudflare DNS ${recordType} record for ${fqdn} updated to ${recordContent} [${modeLabel}].`,
        };
      }

      // 2. Create new record with automatic fallback if proxying is rejected
      const createUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`;
      const saveResult = await this.executeDnsSave(createUrl, 'POST', {
        type: recordType,
        name: fqdn,
        content: recordContent,
        ttl: 1,
        proxied: initialShouldProxy,
        comment: `Managed WhiteLabel Subdomain (${recordType} -> ${recordContent}) (${new Date().toISOString()})`,
      });

      if (!saveResult.ok) {
        const errMsg =
          saveResult.data?.errors?.[0]?.message ||
          `Failed to create ${recordType} record in Cloudflare`;
        throw new Error(errMsg);
      }

      const newRecordId = saveResult.data?.result?.id;
      const modeLabel = saveResult.proxied
        ? 'Proxied (SSL & DDoS protection)'
        : 'DNS-only';
      this.logger.log(
        `[CloudflareDnsService] Created ${recordType} record ${fqdn} -> ${recordContent} [${modeLabel}] (ID: ${newRecordId})`,
      );

      return {
        success: true,
        configured: true,
        recordId: newRecordId,
        fqdn,
        message: `Cloudflare DNS ${recordType} record ${fqdn} created pointing to ${recordContent} [${modeLabel}].`,
      };
    } catch (error: any) {
      const errMsg = error.message || 'Unknown Cloudflare API error';
      this.logger.warn(
        `[CloudflareDnsService] Subdomain ${fqdn} provisioning warning: ${errMsg}`,
      );

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
  async deprovisionSubdomain(
    subdomain: string,
  ): Promise<{ success: boolean; message: string }> {
    const cleanSub = subdomain.trim().toLowerCase();
    const fqdn = `${cleanSub}.${this.baseDomain}`;

    if (!this.apiToken || !this.zoneId) {
      return { success: true, message: 'Cloudflare not configured, skipped.' };
    }

    try {
      const searchUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(fqdn)}`;
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
        for (const rec of existingRecords) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${rec.id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${this.apiToken}`,
              },
            },
          );
          this.logger.log(
            `[CloudflareDnsService] Deleted ${rec.type} record for ${fqdn}`,
          );
        }
      }

      return { success: true, message: `DNS record for ${fqdn} removed.` };
    } catch (error: any) {
      this.logger.warn(
        `[CloudflareDnsService] Failed to delete DNS record for ${fqdn}: ${error.message}`,
      );
      return { success: false, message: error.message };
    }
  }

  /**
   * Verifies whether a WhiteLabel subdomain DNS record and Elastic IPv4 A-record
   * exist in Cloudflare and match the expected configuration.
   */
  async verifySubdomainDns(
    subdomain: string,
    elasticIpv4?: string,
  ): Promise<{
    success: boolean;
    fqdn: string;
    recordType: 'A' | 'CNAME';
    expectedContent: string;
    actualContent?: string;
    proxied?: boolean;
    status: 'ACTIVE' | 'MISMATCHED' | 'NOT_FOUND' | 'ERROR';
    message: string;
  }> {
    const cleanSub = subdomain.trim().toLowerCase();
    const fqdn = `${cleanSub}.${this.baseDomain}`;
    const cleanIp = elasticIpv4?.trim();
    const isIpRouting = Boolean(
      cleanIp && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanIp),
    );

    const expectedType: 'A' | 'CNAME' = isIpRouting ? 'A' : 'CNAME';
    const expectedContent = isIpRouting ? cleanIp! : this.targetCname;

    if (!this.apiToken || !this.zoneId) {
      return {
        success: true,
        fqdn,
        recordType: expectedType,
        expectedContent,
        actualContent: expectedContent,
        proxied: true,
        status: 'ACTIVE',
        message: isIpRouting
          ? `Elastic IP ${cleanIp} A-record active and verified (simulated).`
          : `Subdomain DNS record for ${fqdn} active and verified (simulated).`,
      };
    }

    try {
      const searchUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${encodeURIComponent(fqdn)}`;
      const searchRes = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      const searchData = (await searchRes.json()) as any;
      const records = searchData?.result || [];

      if (records.length === 0) {
        return {
          success: false,
          fqdn,
          recordType: expectedType,
          expectedContent,
          status: 'NOT_FOUND',
          message: `No DNS record found in Cloudflare for ${fqdn}. Click "Sync Subdomain DNS" to provision.`,
        };
      }

      const rec = records[0];
      const actualType = rec.type as 'A' | 'CNAME';
      const actualContent = rec.content as string;
      const isProxied = Boolean(rec.proxied);

      if (
        actualType === expectedType &&
        actualContent.toLowerCase() === expectedContent.toLowerCase()
      ) {
        return {
          success: true,
          fqdn,
          recordType: actualType,
          expectedContent,
          actualContent,
          proxied: isProxied,
          status: 'ACTIVE',
          message: isIpRouting
            ? `Hosted Server Elastic IP A-record is active pointing to ${cleanIp} [${isProxied ? 'Orange Cloud Proxied' : 'DNS-only'}].`
            : `Platform subdomain routing is active pointing to ${expectedContent} [${isProxied ? 'Orange Cloud Proxied' : 'DNS-only'}].`,
        };
      }

      return {
        success: false,
        fqdn,
        recordType: actualType,
        expectedContent,
        actualContent,
        proxied: isProxied,
        status: 'MISMATCHED',
        message: `DNS record points to ${actualType} ${actualContent} instead of expected ${expectedType} ${expectedContent}. Click "Sync Subdomain DNS" to update.`,
      };
    } catch (err: any) {
      return {
        success: false,
        fqdn,
        recordType: expectedType,
        expectedContent,
        status: 'ERROR',
        message: `Failed to query Cloudflare DNS for ${fqdn}: ${err.message}`,
      };
    }
  }
}
