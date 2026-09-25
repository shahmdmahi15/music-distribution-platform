import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NestMiddleware,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { WhiteLabel, WhiteLabelStatus } from 'src/generated/prisma/client';
import * as crypto from 'crypto';

import { RedisService } from 'src/lib/redis/redis.service';

export interface WhitelabelRequest extends Request {
  whiteLabel: WhiteLabel;
}

@Injectable()
export class WhitelabelMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. API Key Extraction
    const rawKey =
      req.headers['x-api-key'] ||
      (typeof req.headers['authorization'] === 'string' &&
      req.headers['authorization'].startsWith('Bearer ')
        ? req.headers['authorization'].slice(7)
        : null);

    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedException('Missing or invalid API Key format');
    }

    const incomingKey = rawKey.trim();
    const incomingHash = crypto
      .createHash('sha256')
      .update(incomingKey)
      .digest('hex');

    let whiteLabel: WhiteLabel | null = null;

    // 2. Direct O(1) Lookup: Check if incoming key is registered to a specific WhiteLabel
    const registeredKeyMeta = await this.redisService.get(
      `whitelabel:apikey:${incomingHash}`,
    );

    if (registeredKeyMeta) {
      try {
        const parsed = JSON.parse(registeredKeyMeta);
        if (parsed.whiteLabelId && parsed.status === 'ACTIVE') {
          whiteLabel = await this.prismaService.whiteLabel.findUnique({
            where: { id: parsed.whiteLabelId },
          });
        }
      } catch (err) {
        // Continue to fallback checks
      }
    }

    // 3. Database Lookup & Redis Re-indexing for persistent tenant API keys
    if (!whiteLabel && incomingKey.startsWith('rmit_live_')) {
      const dbKey = await this.prismaService.whiteLabelApiKey.findFirst({
        where: { keyHash: incomingHash, isActive: true },
        include: { whiteLabel: true },
      });

      if (dbKey && dbKey.whiteLabel) {
        whiteLabel = dbKey.whiteLabel;
        if (whiteLabel.status === WhiteLabelStatus.ACTIVE) {
          // Re-index into Redis for O(1) performance
          await this.redisService.set(
            `whitelabel:apikey:${incomingHash}`,
            JSON.stringify({
              whiteLabelId: whiteLabel.id,
              name: dbKey.name,
              keyId: dbKey.id,
              status: 'ACTIVE',
            }),
          );
        }
        // Telemetry update
        this.prismaService.whiteLabelApiKey
          .update({
            where: { id: dbKey.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
      }

      // Fallback: check Redis tenant configured keys
      if (!whiteLabel) {
        const approvedLabels = await this.prismaService.whiteLabel.findMany({
          where: { status: WhiteLabelStatus.ACTIVE },
        });

        for (const wl of approvedLabels) {
          const cachedKeys = await this.redisService.get(
            `whitelabel:config:${wl.id}:apikeys`,
          );
          if (cachedKeys) {
            try {
              const keys = JSON.parse(cachedKeys);
              const match = keys.find(
                (k: any) => k.hashed === incomingHash && k.status === 'ACTIVE',
              );
              if (match) {
                whiteLabel = wl;
                await this.redisService.set(
                  `whitelabel:apikey:${incomingHash}`,
                  JSON.stringify({
                    whiteLabelId: wl.id,
                    name: match.name,
                    status: 'ACTIVE',
                  }),
                );
                break;
              }
            } catch (e) {
              // continue
            }
          }
        }
      }

      // If key is not found in registered tenant keys or database, reject
      if (!whiteLabel) {
        throw new UnauthorizedException(
          'Invalid or unrecognized API Key. Please verify your integration key in your Platform WhiteLabel dashboard.',
        );
      }
    }

    // 4. Platform Master Key Validation (internal/admin fallback)
    if (!whiteLabel) {
      const targetHash =
        this.configService.get('WHITELABEL_API_KEY', { infer: true }) ||
        this.configService.get('PLATFORM_API_KEY', { infer: true });

      if (targetHash) {
        const bufferIncoming = Buffer.from(incomingHash, 'hex');
        const bufferTarget = Buffer.from(targetHash, 'hex');

        if (
          bufferIncoming.length === bufferTarget.length &&
          crypto.timingSafeEqual(bufferIncoming, bufferTarget)
        ) {
          // Resolve tenant via headers or host
          const subdomainHeader = req.headers['x-whitelabel-subdomain'];
          const domainHeader = req.headers['x-whitelabel-domain'];
          const tenantIdHeader = req.headers['x-whitelabel-id'];

          if (typeof tenantIdHeader === 'string' && tenantIdHeader.trim()) {
            whiteLabel = await this.prismaService.whiteLabel.findUnique({
              where: { id: tenantIdHeader.trim() },
            });
          } else if (
            typeof subdomainHeader === 'string' &&
            subdomainHeader.trim()
          ) {
            whiteLabel = await this.prismaService.whiteLabel.findFirst({
              where: { subdomain: subdomainHeader.trim().toLowerCase() },
            });
          } else if (typeof domainHeader === 'string' && domainHeader.trim()) {
            const dom = domainHeader.trim().toLowerCase();
            whiteLabel = await this.prismaService.whiteLabel.findFirst({
              where: {
                OR: [{ customDomain: dom }, { subdomain: dom }],
              },
            });
          } else {
            // Resolve from host or first approved
            const host = (req.headers['x-forwarded-host'] ||
              req.headers['host'] ||
              '') as string;
            const cleanHost = host.split(':')[0].toLowerCase();
            if (
              cleanHost &&
              cleanHost !== 'localhost' &&
              cleanHost !== '127.0.0.1'
            ) {
              whiteLabel = await this.prismaService.whiteLabel.findFirst({
                where: {
                  OR: [
                    { customDomain: cleanHost },
                    { subdomain: cleanHost.split('.')[0] },
                  ],
                },
              });
            }
            if (!whiteLabel) {
              whiteLabel = await this.prismaService.whiteLabel.findFirst({
                where: { status: WhiteLabelStatus.ACTIVE },
                orderBy: { createdAt: 'asc' },
              });
            }
          }
        }
      }
    }

    if (!whiteLabel) {
      throw new UnauthorizedException(
        'Invalid or unrecognized API Key. Please verify the API key generated for your WhiteLabel portal.',
      );
    }

    // 3. Tenant Status Validation: only active portals can be accessed, EXCEPT for initial setup/tenant route
    const isSetupOrTenantRoute =
      req.originalUrl?.includes('/whitelabel/tenant') ||
      req.baseUrl?.includes('/whitelabel/tenant') ||
      req.path?.includes('/tenant');

    if (
      whiteLabel.status !== WhiteLabelStatus.ACTIVE &&
      !isSetupOrTenantRoute
    ) {
      throw new ForbiddenException(
        `This WhiteLabel portal is currently ${whiteLabel.status.toLowerCase()}. Please complete setup in the onboarding wizard.`,
      );
    }

    (req as WhitelabelRequest).whiteLabel = whiteLabel;
    next();
  }
}
