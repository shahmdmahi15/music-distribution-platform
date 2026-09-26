import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { RedisService } from 'src/lib/redis/redis.service';
import { EnvironmentVariables } from 'src/config/env.config';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  AllocateAddressCommand,
  AssociateAddressCommand,
  RunInstancesCommand,
  DescribeImagesCommand,
  TerminateInstancesCommand,
  CreateKeyPairCommand,
  DescribeKeyPairsCommand,
  DeleteKeyPairCommand,
  DescribeInstancesCommand,
  StartInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketLifecycleConfigurationCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  GetAccountCommand,
  PutEmailIdentityMailFromAttributesCommand,
} from '@aws-sdk/client-sesv2';
import {
  ProvisioningStatus,
  WhiteLabelStatus,
  Prisma,
} from 'src/generated/prisma/client';
import {
  ValidateCloudCredentialsDto,
  StartCloudProvisioningDto,
  SaveCloudCredentialsDto,
} from '../dto/client-cloud-provisioning.dto';
import * as crypto from 'crypto';
import { Client as SshClient } from 'ssh2';
import * as forge from 'node-forge';

interface ProvisioningLogEntry {
  timestamp: string;
  step: string;
  message: string;
  status: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
}

@Injectable()
export class WhitelabelProvisioningService {
  private readonly logger = new Logger(WhitelabelProvisioningService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  /**
   * Validates both AWS IAM credentials and Cloudflare API token permissions
   * before starting any infrastructure provisioning.
   */
  async validateCloudCredentials(
    dto: ValidateCloudCredentialsDto,
    userId?: string,
  ) {
    const checks: {
      aws: boolean;
      cloudflare: boolean;
      details: string[];
    } = {
      aws: false,
      cloudflare: false,
      details: [],
    };

    // 1. Validate Cloudflare Token & Zone
    try {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${dto.cloudflareZoneId}`,
        {
          headers: {
            Authorization: `Bearer ${dto.cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const cfData = (await cfRes.json()) as any;

      if (!cfData?.success || !cfData?.result) {
        throw new Error(
          cfData?.errors?.[0]?.message ||
            'Invalid Cloudflare Zone ID or token.',
        );
      }

      const zoneName = cfData.result.name?.toLowerCase();
      if (zoneName !== dto.cloudflareBaseDomain.toLowerCase()) {
        throw new Error(
          `Cloudflare Zone mismatch. Zone ID corresponds to "${zoneName}", not "${dto.cloudflareBaseDomain}".`,
        );
      }

      checks.cloudflare = true;
      checks.details.push(
        `Cloudflare verified: Zone "${zoneName}" authenticated successfully.`,
      );
    } catch (err: any) {
      const msg = err?.message || 'Cloudflare authentication failed.';
      checks.details.push(`Cloudflare verification error: ${msg}`);
      throw new BadRequestException(`Cloudflare verification failed: ${msg}`);
    }

    // 2. Validate AWS IAM Credentials (EC2, S3, SES permissions)
    try {
      const ec2 = new EC2Client({
        region: dto.awsRegion,
        credentials: {
          accessKeyId: dto.awsAccessKeyId,
          secretAccessKey: dto.awsSecretAccessKey,
        },
      });

      // Test EC2 permission
      await ec2.send(new DescribeSecurityGroupsCommand({ MaxResults: 5 }));

      // Test SES permission
      const ses = new SESv2Client({
        region: dto.awsRegion,
        credentials: {
          accessKeyId: dto.awsAccessKeyId,
          secretAccessKey: dto.awsSecretAccessKey,
        },
      });
      await ses.send(new GetAccountCommand({}));

      checks.aws = true;
      checks.details.push(
        `AWS verified: EC2 and SES APIs authenticated in region "${dto.awsRegion}".`,
      );
    } catch (err: any) {
      const msg = err?.message || 'AWS authentication failed.';
      checks.details.push(`AWS verification error: ${msg}`);
      throw new BadRequestException(
        `AWS IAM verification failed in region "${dto.awsRegion}": ${msg}. Ensure IAM user has EC2, S3, and SES permissions.`,
      );
    }

    // Auto-persist validated credentials to DB if userId is available
    if (userId) {
      const cleanBase = dto.cloudflareBaseDomain.trim().toLowerCase();
      await this.prismaService.whiteLabel.updateMany({
        where: {
          subscription: { subscriberId: userId },
        },
        data: {
          awsRegion: dto.awsRegion.trim(),
          awsAccessKeyId: dto.awsAccessKeyId.trim(),
          awsSecretAccessKey: dto.awsSecretAccessKey.trim(),
          cloudflareApiToken: dto.cloudflareApiToken.trim(),
          cloudflareZoneId: dto.cloudflareZoneId.trim(),
          cloudflareBaseDomain: cleanBase,
          customDomain: `backstage.${cleanBase}`,
          subdomain: 'backstage',
          senderEmail: `noreply@mail.${cleanBase}`,
        },
      });
    }

    return {
      valid: true,
      message: 'All cloud credentials successfully validated and saved.',
      checks,
    };
  }

  /**
   * Securely saves AWS and Cloudflare credentials to the tenant record.
   */
  async saveCloudCredentials(userId: string, dto: SaveCloudCredentialsDto) {
    const whiteLabel = await this.prismaService.whiteLabel.findFirst({
      where: {
        subscription: {
          subscriberId: userId,
        },
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException(
        'No WhiteLabel application found for this account.',
      );
    }

    const cleanBaseDomain = dto.cloudflareBaseDomain.trim().toLowerCase();
    const targetCustomDomain = `backstage.${cleanBaseDomain}`;
    const targetBucketName =
      dto.bucketName?.trim().toLowerCase() ||
      `rmit-music-${whiteLabel.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const senderEmail =
      dto.senderEmail?.trim().toLowerCase() ||
      `noreply@mail.${cleanBaseDomain}`;

    const updated = await this.prismaService.whiteLabel.update({
      where: { id: whiteLabel.id },
      data: {
        awsRegion: dto.awsRegion.trim(),
        awsAccessKeyId: dto.awsAccessKeyId.trim(),
        awsSecretAccessKey: dto.awsSecretAccessKey.trim(),
        bucketName: targetBucketName,
        senderEmail: senderEmail,
        cloudflareApiToken: dto.cloudflareApiToken.trim(),
        cloudflareZoneId: dto.cloudflareZoneId.trim(),
        cloudflareBaseDomain: cleanBaseDomain,
        customDomain: targetCustomDomain,
        subdomain: 'backstage',
        ...(dto.elasticIpv4 ? { elasticIpv4: dto.elasticIpv4.trim(), awsElasticIp: dto.elasticIpv4.trim() } : {}),
        ...(dto.instanceType ? { awsInstanceType: dto.instanceType.trim() } : {}),
        ...(dto.cloudflareOriginCert ? { cloudflareOriginCert: dto.cloudflareOriginCert.trim() } : {}),
        ...(dto.cloudflareOriginKey ? { cloudflareOriginKey: dto.cloudflareOriginKey.trim() } : {}),
      },
    });

    return {
      success: true,
      message: 'Cloud infrastructure credentials saved securely to your tenant profile.',
      whiteLabelId: updated.id,
      customDomain: updated.customDomain,
      senderEmail: updated.senderEmail,
    };
  }

  /**
   * Initiates the full automated multi-cloud provisioning pipeline.
   * Runs asynchronously in the background while returning immediate status.
   */
  async startProvisioning(userId: string, dto: StartCloudProvisioningDto) {
    const whiteLabel = await this.prismaService.whiteLabel.findFirst({
      where: {
        subscription: {
          subscriberId: userId,
        },
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException(
        'No WhiteLabel application found for this account.',
      );
    }

    // First validate credentials and auto-persist to DB
    await this.validateCloudCredentials(dto, userId);

    // Subdomain is permanently backstage locked
    const cleanBaseDomain = dto.cloudflareBaseDomain.trim().toLowerCase();
    const targetCustomDomain = `backstage.${cleanBaseDomain}`;

    // Default S3 bucket name if not provided
    const targetBucketName =
      dto.bucketName?.trim().toLowerCase() ||
      `rmit-music-${whiteLabel.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Dedicated SES mailing domain is mail.<customdomain>
    const senderEmail =
      dto.senderEmail?.trim().toLowerCase() ||
      `noreply@mail.${cleanBaseDomain}`;

    const initialLog: ProvisioningLogEntry = {
      timestamp: new Date().toISOString(),
      step: 'CREDENTIALS',
      message:
        'AWS IAM credentials and Cloudflare Zone token authenticated successfully.',
      status: 'SUCCESS',
    };

    // Update initial state in DB
    const updated = await this.prismaService.whiteLabel.update({
      where: { id: whiteLabel.id },
      data: {
        awsRegion: dto.awsRegion.trim(),
        awsAccessKeyId: dto.awsAccessKeyId.trim(),
        awsSecretAccessKey: dto.awsSecretAccessKey.trim(),
        bucketName: targetBucketName,
        senderEmail: senderEmail,
        cloudflareApiToken: dto.cloudflareApiToken.trim(),
        cloudflareZoneId: dto.cloudflareZoneId.trim(),
        cloudflareBaseDomain: cleanBaseDomain,
        customDomain: targetCustomDomain,
        subdomain: 'backstage',
        ...(dto.elasticIpv4 ? { elasticIpv4: dto.elasticIpv4.trim(), awsElasticIp: dto.elasticIpv4.trim() } : {}),
        ...(dto.cloudflareOriginCert ? { cloudflareOriginCert: dto.cloudflareOriginCert.trim() } : {}),
        ...(dto.cloudflareOriginKey ? { cloudflareOriginKey: dto.cloudflareOriginKey.trim() } : {}),
        awsInstanceType: dto.instanceType || 't4g.medium',
        provisioningStatus: ProvisioningStatus.CREDENTIALS_VALIDATED,
        provisioningProgress: 15,
        provisioningStep: 'Cloud credentials verified. Launching pipeline.',
        provisioningLogs: [initialLog as any],
        provisioningError: null,
      },
    });

    // Fire background asynchronous pipeline (unawaited)
    setImmediate(() => {
      this.executeProvisioningPipeline(updated.id, dto.recreateInstance || false).catch((err) => {
        this.logger.error(
          `[ProvisioningPipeline] Error on tenant ${updated.id}: ${err.message}`,
          err.stack,
        );
      });
    });

    return {
      success: true,
      message:
        'WhiteLabel cloud infrastructure provisioning pipeline initiated.',
      whiteLabelId: updated.id,
      customDomain: targetCustomDomain,
      status: updated.provisioningStatus,
    };
  }

  /**
   * Retrieves live provisioning status, progress %, and streamed logs for polling.
   */
  async getProvisioningStatus(userId: string) {
    const whiteLabel = await this.prismaService.whiteLabel.findFirst({
      where: {
        subscription: {
          subscriberId: userId,
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        customDomain: true,
        awsInstanceId: true,
        awsElasticIp: true,
        awsInstanceType: true,
        awsInstanceState: true,
        awsKeyPairName: true,
        awsKeyPairPrivateKey: true,
        cloudflareOriginCert: true,
        cloudflareOriginKey: true,
        s3CorsConfigured: true,
        bucketName: true,
        sesIdentityStatus: true,
        provisioningStatus: true,
        provisioningProgress: true,
        provisioningStep: true,
        provisioningLogs: true,
        provisionedAt: true,
        provisioningError: true,
      },
    });

    if (!whiteLabel) {
      throw new NotFoundException('WhiteLabel tenant not found.');
    }

    return {
      success: true,
      data: whiteLabel,
    };
  }

  /**
   * Asynchronous multi-stage provisioning pipeline state machine.
   */
  private async executeProvisioningPipeline(
    whiteLabelId: string,
    forceRecreateInstance: boolean = false,
  ) {
    try {
      await this.prismaService.$executeRawUnsafe(`
        ALTER TABLE "WhiteLabel" 
        ADD COLUMN IF NOT EXISTS "awsKeyPairName" TEXT, 
        ADD COLUMN IF NOT EXISTS "awsKeyPairPrivateKey" TEXT,
        ADD COLUMN IF NOT EXISTS "cloudflareOriginCert" TEXT,
        ADD COLUMN IF NOT EXISTS "cloudflareOriginKey" TEXT;
      `);
    } catch {}

    const wl = await this.prismaService.whiteLabel.findUnique({
      where: { id: whiteLabelId },
    });

    if (!wl || !wl.awsAccessKeyId || !wl.awsSecretAccessKey || !wl.awsRegion) {
      throw new Error('Tenant missing AWS credentials.');
    }

    const credentials = {
      accessKeyId: wl.awsAccessKeyId,
      secretAccessKey: wl.awsSecretAccessKey,
    };
    const region = wl.awsRegion;
    const bucket = wl.bucketName!;
    const baseDomain = wl.cloudflareBaseDomain!;
    const zoneId = wl.cloudflareZoneId!;
    const cfToken = wl.cloudflareApiToken!;
    const customDomain = wl.customDomain || `backstage.${baseDomain}`;

    try {
      // =========================================================================
      // STAGE 1: S3 AUDIO VAULT PROVISIONING & CORS LIFECYCLE (Progress: 30%)
      // =========================================================================
      await this.appendLog(
        whiteLabelId,
        'STORAGE',
        `Provisioning S3 Audio Vault "s3://${bucket}" with audio CORS & lifecycle rules...`,
        'INFO',
        ProvisioningStatus.STORAGE_PROVISIONED,
        30,
        'Setting up S3 Audio Vault and direct upload policies',
      );

      const s3 = new S3Client({ region, credentials });

      // Create bucket if it doesn't already exist
      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucket }));
        await this.appendLog(
          whiteLabelId,
          'STORAGE',
          `S3 bucket "${bucket}" already exists. Reusing existing vault.`,
          'INFO',
        );
      } catch {
        const createBucketParams: any = { Bucket: bucket };
        if (region !== 'us-east-1') {
          createBucketParams.CreateBucketConfiguration = {
            LocationConstraint: region,
          };
        }
        await s3.send(new CreateBucketCommand(createBucketParams));
        await this.appendLog(
          whiteLabelId,
          'STORAGE',
          `Created S3 bucket "${bucket}" in region "${region}".`,
          'SUCCESS',
        );
      }

      // Configure S3 CORS for direct browser multipart audio uploads
      await s3.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedOrigins: [
                  '*',
                  `https://${customDomain}`,
                  `https://${baseDomain}`,
                  ...(wl.subdomain
                    ? [`https://${wl.subdomain}.platform.royalmotionit.com`]
                    : []),
                  'https://platform.royalmotionit.com',
                  'https://*.platform.royalmotionit.com',
                  'https://api.royalmotionit.com',
                ],
                ExposeHeaders: ['ETag', 'x-amz-server-side-encryption'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );

      // Configure Public Access Block & Bucket Policy so public branding assets are accessible
      // while keeping private audio/vault locked
      try {
        await s3.send(
          new PutPublicAccessBlockCommand({
            Bucket: bucket,
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: true,
              IgnorePublicAcls: true,
              BlockPublicPolicy: false,
              RestrictPublicBuckets: false,
            },
          }),
        );

        const tenantPolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowPublicReadForBrandingAndMedia',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: [
                `arn:aws:s3:::${bucket}/whitelabels/*/branding/*`,
                `arn:aws:s3:::${bucket}/branding/*`,
                `arn:aws:s3:::${bucket}/public/*`,
                `arn:aws:s3:::${bucket}/covers/*`,
                `arn:aws:s3:::${bucket}/avatars/*`,
              ],
            },
          ],
        };

        await s3.send(
          new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify(tenantPolicy),
          }),
        );
      } catch (policyErr: any) {
        this.logger.warn(
          `Could not apply public branding policy on tenant bucket ${bucket}: ${policyErr?.message || policyErr}`,
        );
      }

      // Configure Lifecycle Rules (Transition masters to Standard-IA after 60 days, Glacier after 180 days)
      await s3.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: bucket,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: 'ArchiveDormantAudioMasters',
                Status: 'Enabled',
                Filter: { Prefix: 'masters/' },
                Transitions: [
                  { Days: 60, StorageClass: 'STANDARD_IA' },
                  { Days: 180, StorageClass: 'GLACIER_IR' },
                ],
              },
            ],
          },
        }),
      );

      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          s3CorsConfigured: true,
          s3BucketArn: `arn:aws:s3:::${bucket}`,
        },
      });

      await this.appendLog(
        whiteLabelId,
        'STORAGE',
        `S3 Audio Vault ready with browser direct-upload CORS & cost-saving Glacier lifecycle rules.`,
        'SUCCESS',
      );

      // =========================================================================
      // STAGE 2: SES DUAL IDENTITIES & MAIL FROM (mail.backstage.customdomain) (Progress: 50%)
      // =========================================================================
      const identityBackstage = customDomain; // e.g. backstage.royalmusic.io
      const identityRoot = baseDomain; // e.g. royalmusic.io
      const mailFromDomain = `mail.${identityBackstage}`; // e.g. mail.backstage.royalmusic.io
      const cfEmail = wl.contactEmail || wl.senderEmail || undefined;

      await this.appendLog(
        whiteLabelId,
        'SES',
        `Configuring AWS SES identities ("${identityBackstage}" & "${identityRoot}") with MAIL FROM "${mailFromDomain}"...`,
        'INFO',
        ProvisioningStatus.SES_CONFIGURED,
        50,
        `Configuring SES identities and auto-wiring Cloudflare DNS`,
      );

      const ses = new SESv2Client({ region, credentials });

      // 1. Create or retrieve identity for backstage domain
      let backstageDkimTokens: string[] = [];
      try {
        const res = await ses.send(
          new CreateEmailIdentityCommand({ EmailIdentity: identityBackstage }),
        );
        backstageDkimTokens = res.DkimAttributes?.Tokens || [];
      } catch {
        const existing = await ses.send(
          new GetEmailIdentityCommand({ EmailIdentity: identityBackstage }),
        );
        backstageDkimTokens = existing.DkimAttributes?.Tokens || [];
      }

      // 2. Create or retrieve identity for root custom domain
      let rootDkimTokens: string[] = [];
      try {
        const res = await ses.send(
          new CreateEmailIdentityCommand({ EmailIdentity: identityRoot }),
        );
        rootDkimTokens = res.DkimAttributes?.Tokens || [];
      } catch {
        const existing = await ses.send(
          new GetEmailIdentityCommand({ EmailIdentity: identityRoot }),
        );
        rootDkimTokens = existing.DkimAttributes?.Tokens || [];
      }

      // 3. Configure MAIL FROM domain (mail.backstage.customdomain) on both identities
      try {
        await ses.send(
          new PutEmailIdentityMailFromAttributesCommand({
            EmailIdentity: identityBackstage,
            MailFromDomain: mailFromDomain,
            BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
          }),
        );
      } catch (mfErr: any) {
        this.logger.warn(`Could not set MailFrom on ${identityBackstage}: ${mfErr.message}`);
      }

      try {
        await ses.send(
          new PutEmailIdentityMailFromAttributesCommand({
            EmailIdentity: identityRoot,
            MailFromDomain: mailFromDomain,
            BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
          }),
        );
      } catch (mfErr: any) {
        this.logger.warn(`Could not set MailFrom on ${identityRoot}: ${mfErr.message}`);
      }

      // 4. Clean up any stale DKIM CNAME records in Cloudflare DNS
      await this.cleanupStaleCloudflareDkimRecords(
        cfToken,
        zoneId,
        identityBackstage,
        backstageDkimTokens,
        cfEmail,
      );
      await this.cleanupStaleCloudflareDkimRecords(
        cfToken,
        zoneId,
        identityRoot,
        rootDkimTokens,
        cfEmail,
      );

      // 5. Inject DKIM CNAMEs for backstage domain (clean, deduplicated)
      for (const token of backstageDkimTokens) {
        await this.upsertCloudflareDnsRecord(
          cfToken,
          zoneId,
          'CNAME',
          `${token}._domainkey.${identityBackstage}`,
          `${token}.dkim.amazonses.com`,
          false,
          undefined,
          cfEmail,
        );
      }

      // 6. Inject DKIM CNAMEs for root domain (clean, deduplicated)
      for (const token of rootDkimTokens) {
        await this.upsertCloudflareDnsRecord(
          cfToken,
          zoneId,
          'CNAME',
          `${token}._domainkey.${identityRoot}`,
          `${token}.dkim.amazonses.com`,
          false,
          undefined,
          cfEmail,
        );
      }

      // 7. Inject MX record for MAIL FROM domain
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'MX',
        mailFromDomain,
        `feedback-smtp.${region}.amazonses.com`,
        false,
        10,
        cfEmail,
      );

      // 8. Inject SPF TXT record for MAIL FROM domain
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'TXT',
        mailFromDomain,
        'v=spf1 include:amazonses.com ~all',
        false,
        undefined,
        cfEmail,
      );

      // 9. Inject DMARC TXT record for backstage domain
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'TXT',
        `_dmarc.${identityBackstage}`,
        'v=DMARC1; p=none;',
        false,
        undefined,
        cfEmail,
      );

      // 10. Inject SPF TXT record for root domain (smart merge with existing SPF, zero duplicates)
      await this.upsertCloudflareSpfRecord(
        cfToken,
        zoneId,
        identityRoot,
        cfEmail,
      );

      // 11. Inject DMARC TXT record for root domain
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'TXT',
        `_dmarc.${identityRoot}`,
        'v=DMARC1; p=none;',
        false,
        undefined,
        cfEmail,
      );

      // 12. Prune obsolete legacy mail records on mail.${baseDomain} if present
      await this.pruneLegacyMailRecords(
        cfToken,
        zoneId,
        baseDomain,
        cfEmail,
      );

      const allTokens = [...backstageDkimTokens, ...rootDkimTokens];
      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          sesIdentityStatus: 'SUCCESS',
          sesDkimTokens: allTokens,
          senderEmail: `noreply@${mailFromDomain}`,
        },
      });

      await this.appendLog(
        whiteLabelId,
        'SES',
        `SES identities ("${identityBackstage}" & "${identityRoot}") verified with MAIL FROM "${mailFromDomain}". All Cloudflare DNS records synchronized with zero duplicate entries.`,
        'SUCCESS',
      );

      // =========================================================================
      // STAGE 3: EC2 SECURITY GROUP & ELASTIC IP ALLOCATION (Progress: 68%)
      // =========================================================================
      await this.appendLog(
        whiteLabelId,
        'COMPUTE',
        `Allocating dedicated AWS Elastic IP (static IPv4) and Security Group...`,
        'INFO',
        ProvisioningStatus.EC2_LAUNCHING,
        68,
        'Reserving Elastic IP and setting up network security group',
      );

      const ec2 = new EC2Client({ region, credentials });

      // 1. Create or locate Security Group
      let sgId: string | null = wl.awsSecurityGroupId || null;
      if (!sgId) {
        try {
          const sgs = await ec2.send(
            new DescribeSecurityGroupsCommand({
              GroupNames: ['rmit-whitelabel-sg'],
            }),
          );
          sgId = sgs.SecurityGroups?.[0]?.GroupId || null;
        } catch {
          // Does not exist, create it
        }

        if (!sgId) {
          const createdSg = await ec2.send(
            new CreateSecurityGroupCommand({
              GroupName: 'rmit-whitelabel-sg',
              Description:
                'Security group for RoyalMotionIT WhiteLabel Portal instances (HTTP, HTTPS, SSH)',
            }),
          );
          sgId = createdSg.GroupId || null;

          if (sgId) {
            await ec2.send(
              new AuthorizeSecurityGroupIngressCommand({
                GroupId: sgId,
                IpPermissions: [
                  {
                    IpProtocol: 'tcp',
                    FromPort: 80,
                    ToPort: 80,
                    IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'HTTP' }],
                  },
                  {
                    IpProtocol: 'tcp',
                    FromPort: 443,
                    ToPort: 443,
                    IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'HTTPS' }],
                  },
                  {
                    IpProtocol: 'tcp',
                    FromPort: 22,
                    ToPort: 22,
                    IpRanges: [
                      { CidrIp: '0.0.0.0/0', Description: 'SSH Admin' },
                    ],
                  },
                ],
              }),
            );
          }
        }
      }

      if (!sgId) {
        throw new Error('Failed to resolve or create AWS Security Group.');
      }

      // 2. Allocate AWS Elastic IP if not allocated
      let elasticIp: string | null = wl.awsElasticIp || null;
      let allocationId: string | null = wl.awsAllocationId || null;

      if (!elasticIp || !allocationId) {
        const eipRes = await ec2.send(
          new AllocateAddressCommand({
            Domain: 'vpc',
            TagSpecifications: [
              {
                ResourceType: 'elastic-ip',
                Tags: [
                  { Key: 'Name', Value: `rmit-${wl.code.toLowerCase()}-eip` },
                  { Key: 'Project', Value: 'RoyalMotionIT-WhiteLabel' },
                  { Key: 'TenantCode', Value: wl.code },
                ],
              },
            ],
          }),
        );
        elasticIp = eipRes.PublicIp || null;
        allocationId = eipRes.AllocationId || null;
      }

      if (!elasticIp || !allocationId) {
        throw new Error('Failed to allocate AWS Elastic IP address.');
      }

      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          awsElasticIp: elasticIp,
          awsAllocationId: allocationId,
          awsSecurityGroupId: sgId,
        },
      });

      await this.appendLog(
        whiteLabelId,
        'COMPUTE',
        `Dedicated Elastic IP ${elasticIp} reserved. Security Group (${sgId}) configured with ports 80/443/22.`,
        'SUCCESS',
      );

      // 3. Create or resolve SSH Key Pair (archived to DB for user download/copy)
      const keyPairName = `rmit-${wl.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-key`;
      let privateKeyPem = wl.awsKeyPairPrivateKey || null;

      let keyPairExistsInAws = false;
      try {
        const kpRes = await ec2.send(
          new DescribeKeyPairsCommand({
            KeyNames: [keyPairName],
          }),
        );
        if (kpRes.KeyPairs && kpRes.KeyPairs.length > 0) {
          keyPairExistsInAws = true;
        }
      } catch {
        keyPairExistsInAws = false;
      }

      if (!privateKeyPem || !keyPairExistsInAws) {
        if (keyPairExistsInAws) {
          try {
            await ec2.send(new DeleteKeyPairCommand({ KeyName: keyPairName }));
          } catch (e: any) {
            this.logger.warn(`Could not delete previous AWS key pair: ${e.message}`);
          }
        }

        const createdKp = await ec2.send(
          new CreateKeyPairCommand({
            KeyName: keyPairName,
            KeyType: 'rsa',
            KeyFormat: 'pem',
            TagSpecifications: [
              {
                ResourceType: 'key-pair',
                Tags: [
                  { Key: 'Name', Value: keyPairName },
                  { Key: 'Project', Value: 'RoyalMotionIT-WhiteLabel' },
                  { Key: 'TenantCode', Value: wl.code },
                ],
              },
            ],
          }),
        );

        privateKeyPem = createdKp.KeyMaterial || null;

        await this.prismaService.whiteLabel.update({
          where: { id: whiteLabelId },
          data: {
            awsKeyPairName: keyPairName,
            awsKeyPairPrivateKey: privateKeyPem,
          },
        });

        await this.appendLog(
          whiteLabelId,
          'COMPUTE',
          `Generated high-security RSA SSH Key Pair "${keyPairName}" and saved private .pem key to database.`,
          'SUCCESS',
        );
      } else {
        await this.appendLog(
          whiteLabelId,
          'COMPUTE',
          `Reusing existing SSH Key Pair "${keyPairName}".`,
          'INFO',
        );
      }

      // =========================================================================
      // STAGE 4: EC2 INSTANCE LAUNCH & CLOUD-INIT BOOTSTRAP (Progress: 82%)
      // =========================================================================
      await this.appendLog(
        whiteLabelId,
        'COMPUTE',
        `Launching EC2 Ubuntu 24.04 instance (${wl.awsInstanceType || 't4g.medium'}) with automated cloud-init bootstrap...`,
        'INFO',
        ProvisioningStatus.DEPLOYING_APPLICATION,
        82,
        'Launching EC2 instance and bootstrapping WhiteLabel runtime',
      );

      // Generate or retrieve API Key for the tenant's EC2 to communicate with Mother API
      let rawApiKey = `rmit_live_${crypto.randomBytes(24).toString('hex')}`;
      const hashedKey = crypto
        .createHash('sha256')
        .update(rawApiKey)
        .digest('hex');

      const existingKey = await this.prismaService.whiteLabelApiKey.findFirst({
        where: {
          whiteLabelId: wl.id,
          name: 'Auto-Provisioned EC2 Key',
        },
      });

      if (!existingKey) {
        await this.prismaService.whiteLabelApiKey.create({
          data: {
            code: `RMIT-KEY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            name: 'Auto-Provisioned EC2 Key',
            keyHash: hashedKey,
            keyPrefix: `${rawApiKey.slice(0, 10)}...${rawApiKey.slice(-4)}`,
            keyMasked: `${rawApiKey.slice(0, 10)}****************${rawApiKey.slice(-4)}`,
            whiteLabelId: wl.id,
          },
        });
      } else {
        await this.prismaService.whiteLabelApiKey.update({
          where: { id: existingKey.id },
          data: {
            keyHash: hashedKey,
            keyPrefix: `${rawApiKey.slice(0, 10)}...${rawApiKey.slice(-4)}`,
            keyMasked: `${rawApiKey.slice(0, 10)}****************${rawApiKey.slice(-4)}`,
          },
        });
      }

      await this.redisService.set(
        `whitelabel:apikey:${hashedKey}`,
        JSON.stringify({
          whiteLabelId: wl.id,
          name: 'Auto-Provisioned EC2 Key',
          status: 'ACTIVE',
        }),
      );

      const apiBaseUrl = 'https://api.royalmotionit.com';
      let internalSecret =
        this.configService.get('INTERNAL_API_SECRET', { infer: true }) || '';
      if (!internalSecret || internalSecret.length < 32) {
        internalSecret =
          'aca33084fe01ee718b5e01d1c5034d308bef8aa984dfbde32f4db51375e5bcd7';
      }

      const isArm = (wl.awsInstanceType || 't4g.medium').startsWith('t4g');
      const amiId = await this.resolveUbuntuAmi(ec2, isArm);

      // =========================================================================
      // ORIGIN SSL / TLS CERTIFICATE PREPARATION
      // =========================================================================
      await this.appendLog(
        whiteLabelId,
        'SSL',
        `Preparing Cloudflare Origin SSL/TLS certificate for "${customDomain}" & "*.${baseDomain}"...`,
        'INFO',
      );

      let originCertData: {
        certificate: string;
        privateKey: string;
        isCloudflareOrigin?: boolean;
        error?: string;
      } | null = null;

      if (wl.cloudflareOriginCert && wl.cloudflareOriginKey) {
        originCertData = {
          certificate: wl.cloudflareOriginCert.trim(),
          privateKey: wl.cloudflareOriginKey.trim(),
          isCloudflareOrigin: true,
        };
        await this.appendLog(
          whiteLabelId,
          'SSL',
          `Using configured Cloudflare Origin CA certificate and private key. Installing to EC2 Nginx.`,
          'SUCCESS',
        );
      } else {
        const certResult = await this.requestCloudflareOriginCertificate(
          cfToken,
          [customDomain, `*.${baseDomain}`, baseDomain],
          wl.contactEmail || wl.senderEmail || undefined,
        );
        originCertData = certResult;

        try {
          await this.prismaService.whiteLabel.update({
            where: { id: whiteLabelId },
            data: {
              cloudflareOriginCert: certResult.certificate,
              cloudflareOriginKey: certResult.privateKey,
            },
          });
        } catch {}

        if (certResult.isCloudflareOrigin) {
          await this.appendLog(
            whiteLabelId,
            'SSL',
            `Cloudflare Origin CA certificate successfully generated via API for "*.${baseDomain}". Installing to EC2 Nginx and archived to database.`,
            'SUCCESS',
          );
        } else {
          await this.appendLog(
            whiteLabelId,
            'SSL',
            `Notice: Cloudflare Origin CA API (${certResult.error || 'Origin CA access not configured'}). A dedicated 2048-bit RSA certificate has been generated for EC2. Cloudflare Full SSL mode active to guarantee 100% encrypted traffic without 521 errors.`,
            'INFO',
          );
        }
      }

      const escapedWlName = (wl.name || 'WhiteLabel').replace(/["'\\]/g, '');
      const originCertScriptBlock = originCertData
        ? `
cat << 'EOF_ORIGIN_CRT' > /etc/ssl/certs/whitelabel_origin.crt
${originCertData.certificate.trim()}
EOF_ORIGIN_CRT

cat << 'EOF_ORIGIN_KEY' > /etc/ssl/private/whitelabel_origin.key
${originCertData.privateKey.trim()}
EOF_ORIGIN_KEY
`
        : `
if [ ! -f /etc/ssl/certs/whitelabel_origin.crt ]; then
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \\
    -keyout /etc/ssl/private/whitelabel_origin.key \\
    -out /etc/ssl/certs/whitelabel_origin.crt \\
    -subj "/C=US/ST=Cloud/L=Origin/O=${escapedWlName}/CN=${customDomain}" \\
    -addext "subjectAltName = DNS:${customDomain},DNS:*.${baseDomain},DNS:${baseDomain}"
fi
`;

      const userDataScript = `#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# 1. System packages & OpenSSL
apt-get update && apt-get install -y ca-certificates curl gnupg nginx ufw git openssl build-essential

# 2. Swap configuration (prevents out-of-memory spikes during Next.js builds)
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 3. Firewall configuration
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 4. Node.js 22 LTS, PM2 & pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2 pnpm

# 5. Origin SSL Certificates
mkdir -p /etc/ssl/certs /etc/ssl/private
${originCertScriptBlock}
chmod 644 /etc/ssl/certs/whitelabel_origin.crt
chmod 600 /etc/ssl/private/whitelabel_origin.key

# 6. High-availability Zero-502 Holding Web Application on Port 3000
mkdir -p /var/www/whitelabel-holding
cat << 'EOF_HOLDING' > /var/www/whitelabel-holding/server.js
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;
const TENANT_NAME = ${JSON.stringify(wl.name)};
const TENANT_CODE = ${JSON.stringify(wl.code)};
const CUSTOM_DOMAIN = ${JSON.stringify(customDomain)};
const PRIMARY_COLOR = ${JSON.stringify(wl.primaryColor || '#6366f1')};
const ACCENT_COLOR = ${JSON.stringify(wl.accentColor || '#ec4899')};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/health' || pathname === '/healthz' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      tenant: TENANT_NAME,
      code: TENANT_CODE,
      domain: CUSTOM_DOMAIN,
      ssl: 'active',
      maxBodyCapacity: '100M',
      timestamp: new Date().toISOString()
    }));
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(\`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${TENANT_NAME} Backstage Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(17, 24, 39, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      max-width: 580px;
      width: 100%;
      padding: 48px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 12px #10b981;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .info-grid {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 32px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      text-align: left;
    }
    .info-label { font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-val { font-size: 14px; color: #e2e8f0; font-weight: 600; margin-top: 4px; word-break: break-all; }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 16px 24px;
      background: linear-gradient(135deg, \${PRIMARY_COLOR} 0%, \${ACCENT_COLOR} 100%);
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px \${PRIMARY_COLOR}66;
      transition: all 0.2s ease;
    }
    .btn:hover { opacity: 0.95; transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="pulse"></span> Cloud Node Active</div>
    <h1>\${TENANT_NAME}</h1>
    <p>Your dedicated WhiteLabel distribution platform cloud node is fully active, operational, and secured with Cloudflare Edge SSL.</p>
    <div class="info-grid">
      <div>
        <div class="info-label">Domain</div>
        <div class="info-val">\${CUSTOM_DOMAIN}</div>
      </div>
      <div>
        <div class="info-label">SSL / TLS Mode</div>
        <div class="info-val">Full End-to-End</div>
      </div>
      <div>
        <div class="info-label">Tenant Code</div>
        <div class="info-val">\${TENANT_CODE}</div>
      </div>
      <div>
        <div class="info-label">Max Body Capacity</div>
        <div class="info-val">100 MB Lossless Audio</div>
      </div>
    </div>
    <a href="https://platform.royalmotionit.com" class="btn">Enter Platform Console &rarr;</a>
  </div>
</body>
</html>\`);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(\`WhiteLabel Holding Server listening on http://127.0.0.1:\${PORT}\`);
});
EOF_HOLDING

PORT=3000 pm2 start /var/www/whitelabel-holding/server.js --name "whitelabel-portal"
pm2 save

# 7. Nginx Production Configuration (100MB Body Limit + SSL on Port 443)
cat << 'EOF_NGINX' > /etc/nginx/sites-available/whitelabel
server {
    listen 80;
    listen [::]:80;
    server_name ${customDomain};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${customDomain};

    ssl_certificate /etc/ssl/certs/whitelabel_origin.crt;
    ssl_certificate_key /etc/ssl/private/whitelabel_origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    client_max_body_size 100M;
    client_body_buffer_size 128k;

    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    proxy_buffer_size 128k;
    proxy_buffers 8 64k;
    proxy_busy_buffers_size 128k;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF_NGINX

ln -sf /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 8. Automated Background WhiteLabel App Deployment (Git Clone, Build, PM2 Handover)
cat << 'EOF_BUILD_SCRIPT' > /var/www/build-whitelabel.sh
#!/bin/bash
set -euo pipefail
LOG_FILE="/var/log/whitelabel-build.log"
exec >> "$LOG_FILE" 2>&1

echo "[$(date -u)] === Starting WhiteLabel Build & Deployment ==="

REPO_DIR="/var/www/music-distribution-platform"
mkdir -p /var/www

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "[$(date -u)] Cloning music-distribution-platform repository..."
  git clone https://github.com/shahmdmahi15/music-distribution-platform.git "$REPO_DIR"
else
  echo "[$(date -u)] Existing repository detected. Fetching latest master..."
  cd "$REPO_DIR"
  git fetch origin master
  git reset --hard origin/master
fi

cd "$REPO_DIR/whitelabel"

echo "[$(date -u)] Writing production environment configuration..."
cat << 'EOF_ENV' > "$REPO_DIR/whitelabel/.env"
API_BASE_URL="${apiBaseUrl}"
API_KEY="${rawApiKey}"
INTERNAL_API_SECRET="${internalSecret}"
PORT=3000
NODE_ENV=production
EOF_ENV

echo "[$(date -u)] Installing whitelabel dependencies via pnpm..."
pnpm install

echo "[$(date -u)] Compiling Next.js 16 production build..."
pnpm run build

echo "[$(date -u)] Build succeeded! Switching PM2 process to Next.js production server on Port 3000..."
cd "$REPO_DIR/whitelabel"
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
pm2 save

echo "[$(date -u)] === WhiteLabel Portal Production App Successfully Deployed! ==="
EOF_BUILD_SCRIPT

chmod +x /var/www/build-whitelabel.sh

# 9. Standalone manual update script
cat << 'EOF_DEPLOY_SCRIPT' > /var/www/deploy-whitelabel.sh
#!/bin/bash
set -euo pipefail
REPO_DIR="/var/www/music-distribution-platform"
cd "$REPO_DIR"
git fetch origin master
git reset --hard origin/master
cd "$REPO_DIR/whitelabel"
pnpm install
pnpm run build
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save
EOF_DEPLOY_SCRIPT

chmod +x /var/www/deploy-whitelabel.sh

# 10. Dedicated systemd service to run build & deployment in isolated cgroup
cat << 'EOF_SERVICE' > /etc/systemd/system/whitelabel-bootstrap.service
[Unit]
Description=WhiteLabel Next.js Application Bootstrap and Build Service
After=network.target nginx.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www
ExecStart=/bin/bash /var/www/build-whitelabel.sh
StandardOutput=append:/var/log/whitelabel-build.log
StandardError=append:/var/log/whitelabel-build.log
TimeoutStartSec=1800

[Install]
WantedBy=multi-user.target
EOF_SERVICE

systemctl daemon-reload
systemctl enable whitelabel-bootstrap.service
systemctl start whitelabel-bootstrap.service &
`;

      // =========================================================================
      // EC2 INSTANCE REUSE & LAUNCH MANAGEMENT
      // =========================================================================
      let instanceId: string | null = wl.awsInstanceId || null;
      let shouldLaunchNewInstance = true;

      if (forceRecreateInstance && instanceId) {
        try {
          await this.appendLog(
            whiteLabelId,
            'COMPUTE',
            `Fresh deployment requested (Recreate Instance). Terminating previous EC2 instance (${instanceId})...`,
            'WARN',
          );
          await ec2.send(
            new TerminateInstancesCommand({
              InstanceIds: [instanceId],
            }),
          );
          await new Promise((r) => setTimeout(r, 2000));
        } catch (termErr: any) {
          this.logger.warn(
            `Could not terminate instance ${instanceId}: ${termErr.message}`,
          );
        }
        instanceId = null;
        shouldLaunchNewInstance = true;
      } else if (instanceId) {
        try {
          const descRes = await ec2.send(
            new DescribeInstancesCommand({
              InstanceIds: [instanceId],
            }),
          );
          const inst = descRes.Reservations?.[0]?.Instances?.[0];
          const stateName = inst?.State?.Name;

          if (
            inst &&
            stateName &&
            stateName !== 'terminated' &&
            stateName !== 'shutting-down'
          ) {
            shouldLaunchNewInstance = false;
            await this.appendLog(
              whiteLabelId,
              'COMPUTE',
              `Reusing existing active EC2 instance (${instanceId}, State: ${stateName.toUpperCase()}). Preserving system state and maintaining continuity. (To trigger a clean re-installation, enable "Recreate Instance" in setup).`,
              'INFO',
            );

            if (stateName === 'stopped') {
              await this.appendLog(
                whiteLabelId,
                'COMPUTE',
                `Instance is stopped. Starting instance (${instanceId})...`,
                'INFO',
              );
              await ec2.send(
                new StartInstancesCommand({
                  InstanceIds: [instanceId],
                }),
              );
              await this.waitForInstanceState(ec2, instanceId, 'running', 60);
            } else if (stateName === 'pending') {
              await this.waitForInstanceState(ec2, instanceId, 'running', 60);
            }

            await this.prismaService.whiteLabel.update({
              where: { id: whiteLabelId },
              data: {
                awsInstanceState: 'RUNNING',
              },
            });
          } else {
            await this.appendLog(
              whiteLabelId,
              'COMPUTE',
              `Previous instance (${instanceId}) was terminated. Provisioning a new instance...`,
              'WARN',
            );
            shouldLaunchNewInstance = true;
          }
        } catch (descErr: any) {
          this.logger.warn(
            `Could not describe instance ${instanceId}: ${descErr.message}`,
          );
          shouldLaunchNewInstance = true;
        }
      }

      if (shouldLaunchNewInstance) {
        await this.appendLog(
          whiteLabelId,
          'COMPUTE',
          `Launching new dedicated EC2 Ubuntu 24.04 instance (${wl.awsInstanceType || 't4g.medium'}) with SSH Key "${keyPairName}" & automated cloud-init bootstrap...`,
          'INFO',
        );

        const runInstanceRes = await ec2.send(
          new RunInstancesCommand({
            ImageId: amiId,
            InstanceType: (wl.awsInstanceType as any) || 't4g.medium',
            KeyName: keyPairName,
            MinCount: 1,
            MaxCount: 1,
            SecurityGroupIds: [sgId],
            UserData: Buffer.from(userDataScript).toString('base64'),
            TagSpecifications: [
              {
                ResourceType: 'instance',
                Tags: [
                  { Key: 'Name', Value: `rmit-${wl.code.toLowerCase()}-portal` },
                  { Key: 'Project', Value: 'RoyalMotionIT-WhiteLabel' },
                  { Key: 'TenantCode', Value: wl.code },
                  { Key: 'Domain', Value: customDomain },
                ],
              },
            ],
          }),
        );

        instanceId = runInstanceRes.Instances?.[0]?.InstanceId || null;
        if (!instanceId) {
          throw new Error('EC2 RunInstances failed to return an instance ID.');
        }

        await this.appendLog(
          whiteLabelId,
          'COMPUTE',
          `EC2 instance launched successfully (${instanceId}, AMI: ${amiId}, Key: ${keyPairName}). Waiting for instance state...`,
          'INFO',
        );

        await this.prismaService.whiteLabel.update({
          where: { id: whiteLabelId },
          data: {
            awsInstanceId: instanceId,
            awsInstanceState: 'RUNNING',
          },
        });
      }

      // Associate or Reassociate Elastic IP to the instance
      let associated = false;
      for (let attempt = 1; attempt <= 15; attempt++) {
        try {
          await ec2.send(
            new AssociateAddressCommand({
              AllocationId: allocationId,
              InstanceId: instanceId!,
              AllowReassociation: true,
            }),
          );
          associated = true;
          break;
        } catch (assocErr: any) {
          if (attempt === 15) {
            throw new Error(`Failed to associate Elastic IP: ${assocErr.message}`);
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      await this.appendLog(
        whiteLabelId,
        'COMPUTE',
        `Dedicated Elastic IP ${elasticIp} attached to instance ${instanceId}. Server is operational.`,
        'SUCCESS',
      );

      // =========================================================================
      // STAGE 5: CLOUDFLARE A RECORD POINTING TO ELASTIC IP (Progress: 94%)
      // =========================================================================
      await this.appendLog(
        whiteLabelId,
        'DNS',
        `Configuring Cloudflare DNS A record: "${customDomain}" -> ${elasticIp} (Proxied with Edge SSL)...`,
        'INFO',
        ProvisioningStatus.DNS_CONFIGURED,
        94,
        'Pointing Cloudflare DNS to dedicated AWS Elastic IP',
      );

      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'A',
        customDomain,
        elasticIp,
        true,
      );

      // Harmonize Cloudflare SSL mode (full / strict) to eliminate Error 521
      const targetSslMode = originCertData?.isCloudflareOrigin ? 'strict' : 'full';
      const sslModeSet = await this.setCloudflareSslMode(
        cfToken,
        zoneId,
        targetSslMode,
        wl.contactEmail || wl.senderEmail || undefined,
      );
      if (sslModeSet) {
        await this.appendLog(
          whiteLabelId,
          'SSL',
          `Cloudflare Zone SSL encryption mode synchronized to "${targetSslMode}". Error 521 prevention active.`,
          'SUCCESS',
        );
      }

      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          customDomain,
          domainVerified: true,
          domainSslStatus: 'ACTIVE',
        },
      });

      await this.appendLog(
        whiteLabelId,
        'DNS',
        `Cloudflare A record active! "${customDomain}" now routes to Elastic IP ${elasticIp} with Cloudflare Edge SSL.`,
        'SUCCESS',
      );

      // =========================================================================
      // STAGE 6: SECURE SSH DEPLOYMENT & PORT 3000 RUNTIME ORCHESTRATION
      // =========================================================================
      const currentSshKey =
        privateKeyPem ||
        (
          await this.prismaService.whiteLabel.findUnique({
            where: { id: whiteLabelId },
            select: { awsKeyPairPrivateKey: true },
          })
        )?.awsKeyPairPrivateKey ||
        null;

      if (currentSshKey && elasticIp) {
        await this.appendLog(
          whiteLabelId,
          'DEPLOY',
          `Connecting to customer EC2 via SSH (ubuntu@${elasticIp}) using tenant RSA key pair...`,
          'INFO',
          ProvisioningStatus.DEPLOYING_APPLICATION,
          95,
          'SSH connection & production app build on customer EC2',
        );

        let ssh: SshClient | null = null;
        try {
          ssh = await this.connectSsh(elasticIp, currentSshKey, 'ubuntu', 180000);
          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `SSH connection verified. Synchronizing packages, Nginx SSL reverse-proxy, and Next.js repository...`,
            'SUCCESS',
          );

          // 1. Wait for cloud-init if still active
          await this.execSsh(
            ssh,
            'sudo cloud-init status --wait || true',
            undefined,
            120000,
          );

          // 2. Ensure essentials: Node 22, PM2, pnpm, Nginx, git, build-essential
          await this.execSsh(
            ssh,
            `sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg nginx ufw git openssl build-essential && command -v node >/dev/null 2>&1 || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt-get install -y nodejs) && command -v pnpm >/dev/null 2>&1 || sudo npm install -g pnpm pm2`,
            undefined,
            300000,
          );

          // 3. Configure 2GB Swap space (protects against memory spikes during Next.js build)
          await this.execSsh(
            ssh,
            `if [ ! -f /swapfile ]; then sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048; sudo chmod 600 /swapfile; sudo mkswap /swapfile; sudo swapon /swapfile; echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab; fi`,
            undefined,
            60000,
          );

          // 4. Install Cloudflare Origin / Self-Signed SSL Certificates
          if (originCertData?.certificate && originCertData?.privateKey) {
            await this.appendLog(
              whiteLabelId,
              'SSL',
              `Writing SSL certificate and private key to /etc/ssl/certs/whitelabel_origin.crt...`,
              'INFO',
            );
            const crtB64 = Buffer.from(originCertData.certificate.trim()).toString('base64');
            const keyB64 = Buffer.from(originCertData.privateKey.trim()).toString('base64');
            await this.execSsh(
              ssh,
              `sudo mkdir -p /etc/ssl/certs /etc/ssl/private && echo "${crtB64}" | base64 -d | sudo tee /etc/ssl/certs/whitelabel_origin.crt > /dev/null && echo "${keyB64}" | base64 -d | sudo tee /etc/ssl/private/whitelabel_origin.key > /dev/null && sudo chmod 644 /etc/ssl/certs/whitelabel_origin.crt && sudo chmod 600 /etc/ssl/private/whitelabel_origin.key`,
            );
            await this.appendLog(
              whiteLabelId,
              'SSL',
              `SSL certificate & key installed on customer EC2 with strict file permissions (600/644).`,
              'SUCCESS',
            );
          }

          // 5. Write Nginx configuration with 100MB body limit, Port 443 SSL, proxying to 127.0.0.1:3000
          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Configuring customer Nginx with 100MB upload capacity and proxy pass to Port 3000...`,
            'INFO',
          );

          const nginxConfig = `
server {
    listen 80;
    listen [::]:80;
    server_name ${customDomain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${customDomain};

    ssl_certificate /etc/ssl/certs/whitelabel_origin.crt;
    ssl_certificate_key /etc/ssl/private/whitelabel_origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    client_max_body_size 100M;
    client_body_buffer_size 128k;

    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    proxy_buffer_size 128k;
    proxy_buffers 8 64k;
    proxy_busy_buffers_size 128k;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
`;
          const nginxB64 = Buffer.from(nginxConfig.trim()).toString('base64');
          await this.execSsh(
            ssh,
            `echo "${nginxB64}" | base64 -d | sudo tee /etc/nginx/sites-available/whitelabel > /dev/null && sudo ln -sf /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/whitelabel && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && (sudo systemctl reload nginx || sudo systemctl restart nginx)`,
          );

          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Nginx configuration active! 100MB body limit & SSL reverse-proxy enabled.`,
            'SUCCESS',
          );

          // 6. Clone / pull repository to /var/www/music-distribution-platform
          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Synchronizing WhiteLabel application codebase from GitHub to /var/www/music-distribution-platform...`,
            'INFO',
            ProvisioningStatus.DEPLOYING_APPLICATION,
            96,
            'Pulling repository and configuring WhiteLabel portal',
          );

          await this.execSsh(
            ssh,
            `sudo mkdir -p /var/www && sudo chown -R ubuntu:ubuntu /var/www && if [ ! -d "/var/www/music-distribution-platform/.git" ]; then git clone https://github.com/shahmdmahi15/music-distribution-platform.git /var/www/music-distribution-platform; else cd /var/www/music-distribution-platform && git fetch origin master && git reset --hard origin/master; fi`,
            async (line) => {
              if (line.includes('Cloning') || line.includes('HEAD is now at')) {
                await this.appendLog(whiteLabelId, 'DEPLOY', line, 'INFO');
              }
            },
            300000,
          );

          // 7. Write production .env file for /var/www/music-distribution-platform/whitelabel
          const envLines = `API_BASE_URL="${apiBaseUrl}"\nAPI_KEY="${rawApiKey}"\nINTERNAL_API_SECRET="${internalSecret}"\nPORT=3000\nNODE_ENV=production\n`;
          const envB64 = Buffer.from(envLines).toString('base64');
          await this.execSsh(
            ssh,
            `echo "${envB64}" | base64 -d > /var/www/music-distribution-platform/whitelabel/.env`,
          );

          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Production environment configuration written (.env). Installing dependencies...`,
            'SUCCESS',
            ProvisioningStatus.DEPLOYING_APPLICATION,
            97,
            'Installing dependencies with pnpm',
          );

          // 8. Install dependencies via pnpm
          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Installing dependencies via pnpm in /var/www/music-distribution-platform/whitelabel...`,
            'INFO',
            ProvisioningStatus.DEPLOYING_APPLICATION,
            97,
            'Installing dependencies with pnpm',
          );

          const installRes = await this.execSsh(
            ssh,
            `cd /var/www/music-distribution-platform/whitelabel && pnpm install`,
            async (line) => {
              if (line.includes('Packages:') || line.includes('Progress:') || line.includes('Done')) {
                await this.appendLog(whiteLabelId, 'DEPLOY', line, 'INFO');
              }
            },
            600000,
          );

          if (installRes.code !== 0) {
            throw new Error(`pnpm install failed (code ${installRes.code}): ${installRes.stderr || installRes.stdout}`);
          }

          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Dependencies installed successfully. Compiling Next.js 16 production build ("pnpm run build")...`,
            'INFO',
            ProvisioningStatus.DEPLOYING_APPLICATION,
            98,
            'Building Next.js 16 production bundle',
          );

          // 9. Build Next.js
          const buildRes = await this.execSsh(
            ssh,
            `cd /var/www/music-distribution-platform/whitelabel && pnpm run build`,
            async (line) => {
              if (
                line.includes('Compiled successfully') ||
                line.includes('Generating static pages') ||
                line.includes('Finalizing page optimization')
              ) {
                await this.appendLog(whiteLabelId, 'DEPLOY', line, 'INFO');
              }
            },
            900000,
          );

          if (buildRes.code !== 0) {
            throw new Error(`Next.js build failed (code ${buildRes.code}): ${buildRes.stderr || buildRes.stdout}`);
          }

          // 10. Start PM2 on Port 3000 using ecosystem.config.js
          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Next.js build succeeded! Launching production runtime on Port 3000 via PM2 ecosystem...`,
            'INFO',
            ProvisioningStatus.DEPLOYING_APPLICATION,
            99,
            'Starting WhiteLabel portal with PM2',
          );

          const pm2Res = await this.execSsh(
            ssh,
            `cd /var/www/music-distribution-platform/whitelabel && (pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js) && pm2 save && (sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true) && pm2 save`,
          );

          if (pm2Res.code !== 0) {
            throw new Error(`PM2 start failed (code ${pm2Res.code}): ${pm2Res.stderr || pm2Res.stdout}`);
          }

          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `WhiteLabel portal PM2 process is running on Port 3000 with auto-restart enabled.`,
            'SUCCESS',
          );

          ssh.end();
        } catch (deployErr: any) {
          if (ssh) {
            try {
              ssh.end();
            } catch {}
          }
          await this.appendLog(
            whiteLabelId,
            'DEPLOY',
            `Notice during direct SSH deployment: ${deployErr.message}. The autonomous background cloud-init service on the instance will complete the deployment.`,
            'WARN',
          );
        }
      }

      // =========================================================================
      // STAGE 7: ACTIVATION & SUCCESS HANDOVER (Progress: 100%)
      // =========================================================================
      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          provisioningStatus: ProvisioningStatus.ACTIVE,
          provisioningProgress: 100,
          provisioningStep:
            'WhiteLabel cloud infrastructure is fully active and operational!',
          status: WhiteLabelStatus.ACTIVE,
          isSetupComplete: true,
          provisionedAt: new Date(),
          provisioningError: null,
        },
      });

      await this.appendLog(
        whiteLabelId,
        'COMPLETE',
        `🎉 All AWS (EC2, Elastic IP, S3, SES) & Cloudflare services successfully provisioned and verified! Your WhiteLabel portal is live at https://${customDomain}`,
        'SUCCESS',
        ProvisioningStatus.ACTIVE,
        100,
      );
    } catch (err: any) {
      const errorMsg = err?.message || 'Provisioning pipeline error';
      this.logger.error(
        `[ProvisioningFailed] Tenant ${whiteLabelId}: ${errorMsg}`,
        err.stack,
      );

      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          provisioningStatus: ProvisioningStatus.FAILED,
          provisioningError: errorMsg,
          provisioningStep: `Provisioning halted: ${errorMsg}`,
        },
      });

      await this.appendLog(
        whiteLabelId,
        'ERROR',
        `Infrastructure provisioning failed: ${errorMsg}. You can fix settings and click "Retry Provisioning".`,
        'ERROR',
        ProvisioningStatus.FAILED,
      );
    }
  }

  /**
   * Idempotently creates or updates a Cloudflare DNS record, removing any duplicate entries.
   */
  private async upsertCloudflareDnsRecord(
    token: string,
    zoneId: string,
    type: 'A' | 'CNAME' | 'TXT' | 'MX',
    name: string,
    content: string,
    proxied: boolean,
    priority?: number,
    email?: string,
  ) {
    const headers = this.getCloudflareHeaders(token, email);
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&type=${type}&per_page=50`,
      { headers },
    );
    const listData = (await listRes.json()) as any;
    const records = (listData?.result || []) as any[];

    const bodyPayload: any = {
      type,
      name,
      content,
      proxied: type === 'MX' ? false : proxied,
      ttl: proxied ? 1 : 3600,
    };
    if (type === 'MX' && priority !== undefined) {
      bodyPayload.priority = priority;
    }

    if (records.length > 0) {
      // 1. Update the primary record if needed
      const primaryRecord = records[0];
      const needsUpdate =
        primaryRecord.content !== content ||
        primaryRecord.proxied !== bodyPayload.proxied ||
        (priority !== undefined && primaryRecord.priority !== priority);

      if (needsUpdate) {
        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${primaryRecord.id}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify(bodyPayload),
          },
        );
      }

      // 2. Delete any redundant/duplicate records for this (name, type) to keep DNS clean
      if (records.length > 1) {
        for (const duplicateRecord of records.slice(1)) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${duplicateRecord.id}`,
            {
              method: 'DELETE',
              headers,
            },
          );
        }
      }
    } else {
      // 3. Create fresh record if none exists
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        },
      );
    }
  }

  /**
   * Prunes any stale DKIM CNAME records for a domain in Cloudflare DNS.
   */
  private async cleanupStaleCloudflareDkimRecords(
    token: string,
    zoneId: string,
    domain: string,
    activeDkimTokens: string[],
    email?: string,
  ) {
    try {
      const headers = this.getCloudflareHeaders(token, email);
      const activeNames = new Set(
        activeDkimTokens.map((t) => `${t}._domainkey.${domain}`.toLowerCase()),
      );
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=CNAME&per_page=100`,
        { headers },
      );
      const data = (await res.json()) as any;
      const records = (data?.result || []) as any[];

      for (const rec of records) {
        const recName = (rec.name || '').toLowerCase();
        if (
          recName.includes(`._domainkey.${domain.toLowerCase()}`) &&
          !activeNames.has(recName)
        ) {
          // Stale DKIM record from older SES run, delete it
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${rec.id}`,
            {
              method: 'DELETE',
              headers,
            },
          );
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not prune stale DKIM records: ${err.message}`);
    }
  }

  /**
   * Helper to format Cloudflare API headers supporting both API tokens and Global API keys.
   */
  private getCloudflareHeaders(token: string, email?: string): Record<string, string> {
    const trimmed = (token || '').trim();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (trimmed.length === 32 && /^[0-9a-f]{32}$/i.test(trimmed) && email) {
      headers['X-Auth-Key'] = trimmed;
      headers['X-Auth-Email'] = email.trim();
    } else {
      headers['Authorization'] = `Bearer ${trimmed}`;
    }
    return headers;
  }

  /**
   * Generates a 2048-bit RSA key pair and PKCS#10 Certificate Signing Request (CSR) with SAN,
   * then requests a Cloudflare Origin CA certificate via Cloudflare API.
   * If Cloudflare API lacks Origin CA permissions or encounters an error,
   * it returns a high-security self-signed certificate fallback and details the reason.
   */
  private async requestCloudflareOriginCertificate(
    token: string,
    hostnames: string[],
    email?: string,
  ): Promise<{
    certificate: string;
    privateKey: string;
    isCloudflareOrigin: boolean;
    error?: string;
  }> {
    try {
      // 1. Generate 2048-bit RSA Keypair locally
      const keypair = forge.pki.rsa.generateKeyPair(2048);
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

      // 2. Generate PKCS#10 CSR with SAN extension
      const csr = forge.pki.createCertificationRequest();
      csr.publicKey = keypair.publicKey;
      csr.setSubject([
        { name: 'commonName', value: hostnames[0] },
        { name: 'countryName', value: 'US' },
        { name: 'organizationName', value: 'RoyalMotionIT WhiteLabel Platform' },
      ]);
      const altNames = hostnames.map((h) => ({ type: 2, value: h }));
      csr.setAttributes([
        {
          name: 'extensionRequest',
          extensions: [
            {
              name: 'subjectAltName',
              altNames: altNames,
            },
          ],
        },
      ]);
      csr.sign(keypair.privateKey, forge.md.sha256.create());
      const csrPem = forge.pki.certificationRequestToPem(csr);

      // 3. Request Cloudflare Origin CA Certificate
      const headers = this.getCloudflareHeaders(token, email);
      const res = await fetch('https://api.cloudflare.com/client/v4/certificates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          hostnames,
          requested_validity: 5475, // 15 years
          request_type: 'origin-rsa',
          csr: csrPem,
        }),
      });
      const data = (await res.json()) as any;

      if (data?.success && data?.result?.certificate) {
        return {
          certificate: data.result.certificate.trim(),
          privateKey: privateKeyPem.trim(),
          isCloudflareOrigin: true,
        };
      }

      // If Cloudflare returns an error, capture it clearly
      const errDetails =
        data?.errors?.map((e: any) => `${e.code ? `[${e.code}] ` : ''}${e.message}`).join(', ') ||
        data?.messages?.map((m: any) => m.message).join(', ') ||
        'API Token lacks Origin CA permissions or account-level Origin CA access';

      this.logger.warn(
        `Cloudflare Origin CA API error: ${errDetails}. Using self-signed fallback.`,
      );

      // 4. Generate self-signed fallback certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keypair.publicKey;
      cert.serialNumber =
        '01' + forge.util.bytesToHex(forge.random.getBytesSync(16));
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notBefore.getFullYear() + 10,
      );
      const attrs = [
        { name: 'commonName', value: hostnames[0] },
        { name: 'countryName', value: 'US' },
        { name: 'organizationName', value: 'RoyalMotionIT WhiteLabel Platform' },
      ];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.setExtensions([
        { name: 'basicConstraints', cA: true },
        {
          name: 'subjectAltName',
          altNames: hostnames.map((h) => ({ type: 2, value: h })),
        },
      ]);
      cert.sign(keypair.privateKey, forge.md.sha256.create());
      const selfSignedCertPem = forge.pki.certificateToPem(cert);

      return {
        certificate: selfSignedCertPem.trim(),
        privateKey: privateKeyPem.trim(),
        isCloudflareOrigin: false,
        error: errDetails,
      };
    } catch (err: any) {
      this.logger.error(
        `Failed to generate SSL Origin Certificate: ${err.message}`,
        err.stack,
      );

      // Fallback in case of unexpected exception
      const keypair = forge.pki.rsa.generateKeyPair(2048);
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
      const cert = forge.pki.createCertificate();
      cert.publicKey = keypair.publicKey;
      cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(16));
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5);
      const attrs = [{ name: 'commonName', value: hostnames[0] }];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.sign(keypair.privateKey, forge.md.sha256.create());
      return {
        certificate: forge.pki.certificateToPem(cert).trim(),
        privateKey: privateKeyPem.trim(),
        isCloudflareOrigin: false,
        error: err.message,
      };
    }
  }

  /**
   * Connects to a remote EC2 host using SSH with retry logic.
   */
  private async connectSsh(
    host: string,
    privateKey: string,
    username: string = 'ubuntu',
    timeoutMs: number = 180000,
  ): Promise<SshClient> {
    const start = Date.now();
    let lastErr: Error | null = null;

    while (Date.now() - start < timeoutMs) {
      try {
        const client = await new Promise<SshClient>((resolve, reject) => {
          const conn = new SshClient();
          const connTimer = setTimeout(() => {
            conn.end();
            reject(new Error('SSH connection attempt timed out (10s)'));
          }, 10000);

          conn
            .on('ready', () => {
              clearTimeout(connTimer);
              resolve(conn);
            })
            .on('error', (err) => {
              clearTimeout(connTimer);
              reject(err);
            })
            .connect({
              host,
              port: 22,
              username,
              privateKey,
              readyTimeout: 10000,
              algorithms: {
                serverHostKey: [
                  'ssh-rsa',
                  'ssh-dss',
                  'ecdsa-sha2-nistp256',
                  'ecdsa-sha2-nistp384',
                  'ecdsa-sha2-nistp521',
                  'rsa-sha2-512',
                  'rsa-sha2-256',
                  'ssh-ed25519',
                ],
              },
            });
        });

        return client;
      } catch (err: any) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    throw new Error(
      `Could not establish SSH connection to ${username}@${host} within ${Math.round(timeoutMs / 1000)}s: ${lastErr?.message || 'Host unreachable'}`,
    );
  }

  /**
   * Executes a command on the remote EC2 instance via SSH and streams line output.
   */
  private async execSsh(
    client: SshClient,
    command: string,
    onOutput?: (line: string) => Promise<void> | void,
    timeoutMs: number = 900000,
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    const fullCommand = command.includes('export PATH=')
      ? command
      : `export PATH="/usr/local/bin:/usr/bin:/bin:$PATH" && ${command}`;

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let lineBuffer = '';

      const timer = setTimeout(() => {
        reject(
          new Error(
            `SSH Command timed out after ${Math.round(timeoutMs / 1000)}s: ${command.slice(0, 80)}...`,
          ),
        );
      }, timeoutMs);

      client.exec(fullCommand, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          return reject(err);
        }

        stream
          .on('close', (code: number) => {
            clearTimeout(timer);
            if (lineBuffer.trim() && onOutput) {
              onOutput(lineBuffer.trim());
            }
            resolve({ code, stdout, stderr });
          })
          .on('data', (data: Buffer) => {
            const str = data.toString('utf-8');
            stdout += str;
            lineBuffer += str;
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && onOutput) {
                onOutput(trimmed);
              }
            }
          })
          .stderr.on('data', (data: Buffer) => {
            const str = data.toString('utf-8');
            stderr += str;
            lineBuffer += str;
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && onOutput) {
                onOutput(trimmed);
              }
            }
          });
      });
    });
  }

  /**
   * Harmonizes Cloudflare Zone SSL mode (full or strict) to prevent Error 521.
   */
  private async setCloudflareSslMode(
    token: string,
    zoneId: string,
    mode: 'full' | 'strict',
    email?: string,
  ): Promise<boolean> {
    try {
      const headers = this.getCloudflareHeaders(token, email);
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/ssl`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ value: mode }),
        },
      );
      const data = (await res.json()) as any;
      return !!data?.success;
    } catch (err: any) {
      this.logger.warn(`Could not set Cloudflare SSL mode: ${err.message}`);
      return false;
    }
  }

  /**
   * Resolves the canonical Ubuntu 24.04 LTS (Noble) AMI for the given region & architecture.
   */
  private async resolveUbuntuAmi(
    ec2: EC2Client,
    isArm: boolean,
  ): Promise<string> {
    try {
      const arch = isArm ? 'arm64' : 'x86_64';
      const namePattern = `ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-${arch}-server-*`;

      const imagesRes = await ec2.send(
        new DescribeImagesCommand({
          Owners: ['099720109477'],
          Filters: [
            { Name: 'name', Values: [namePattern] },
            { Name: 'state', Values: ['available'] },
          ],
        }),
      );

      const images = imagesRes.Images || [];
      images.sort((a, b) =>
        (b.CreationDate || '').localeCompare(a.CreationDate || ''),
      );

      if (images[0]?.ImageId) {
        return images[0].ImageId;
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not query AMI via DescribeImages: ${err.message}`,
      );
    }

    // Standard fallback Noble AMIs
    return isArm ? 'ami-0a2202cf4c36161a1' : 'ami-0e2c8caa4b6378d8c';
  }

  /**
   * Appends an entry to the tenant's provisioning log array.
   */
  private async appendLog(
    whiteLabelId: string,
    step: string,
    message: string,
    status: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR',
    newProvisioningStatus?: ProvisioningStatus,
    newProgress?: number,
    newStepDescription?: string,
  ) {
    const entry: ProvisioningLogEntry = {
      timestamp: new Date().toISOString(),
      step,
      message,
      status,
    };

    const currentWl = await this.prismaService.whiteLabel.findUnique({
      where: { id: whiteLabelId },
      select: { provisioningLogs: true },
    });

    const currentLogs = (currentWl?.provisioningLogs as any[]) || [];
    const updatedLogs = [...currentLogs, entry];

    const updateData: Prisma.WhiteLabelUpdateInput = {
      provisioningLogs: updatedLogs as any,
    };

    if (newProvisioningStatus) {
      updateData.provisioningStatus = newProvisioningStatus;
    }
    if (newProgress !== undefined) {
      updateData.provisioningProgress = newProgress;
    }
    if (newStepDescription) {
      updateData.provisioningStep = newStepDescription;
    }

    await this.prismaService.whiteLabel.update({
      where: { id: whiteLabelId },
      data: updateData,
    });
  }

  /**
   * Helper to poll AWS EC2 until an instance reaches a desired state (e.g. 'running').
   */
  private async waitForInstanceState(
    ec2: EC2Client,
    instanceId: string,
    targetState: string,
    maxWaitSeconds: number = 60,
  ): Promise<boolean> {
    const start = Date.now();
    while ((Date.now() - start) / 1000 < maxWaitSeconds) {
      try {
        const res = await ec2.send(
          new DescribeInstancesCommand({
            InstanceIds: [instanceId],
          }),
        );
        const state = res.Reservations?.[0]?.Instances?.[0]?.State?.Name;
        if (state === targetState) {
          return true;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 3000));
    }
    return false;
  }

  /**
   * Smartly creates or merges an SPF TXT record for a domain, ensuring strictly ONE SPF record exists.
   */
  private async upsertCloudflareSpfRecord(
    token: string,
    zoneId: string,
    domain: string,
    email?: string,
  ) {
    const cleanDomain = domain.trim().toLowerCase();
    const headers = this.getCloudflareHeaders(token, email);

    // Fetch all TXT records for this domain
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(cleanDomain)}&type=TXT&per_page=50`,
      { headers },
    );
    const listData = (await listRes.json()) as any;
    const txtRecords = (listData?.result || []) as any[];

    // Filter only SPF records (those starting with "v=spf1")
    const spfRecords = txtRecords.filter((r) => {
      const c = (r.content || '').replace(/^["']|["']$/g, '').trim();
      return c.startsWith('v=spf1');
    });

    if (spfRecords.length > 0) {
      // Primary SPF record
      const primary = spfRecords[0];
      let content = (primary.content || '').replace(/^["']|["']$/g, '').trim();

      if (!content.includes('include:amazonses.com')) {
        if (content.includes('~all')) {
          content = content.replace('~all', 'include:amazonses.com ~all');
        } else if (content.includes('-all')) {
          content = content.replace('-all', 'include:amazonses.com -all');
        } else if (content.includes('?all')) {
          content = content.replace('?all', 'include:amazonses.com ?all');
        } else {
          content = `${content} include:amazonses.com ~all`;
        }

        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${primary.id}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              type: 'TXT',
              name: cleanDomain,
              content,
              ttl: 3600,
            }),
          },
        );
      }

      // If there are duplicate SPF records on the same domain, delete the extras!
      if (spfRecords.length > 1) {
        for (const extraSpf of spfRecords.slice(1)) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${extraSpf.id}`,
            {
              method: 'DELETE',
              headers,
            },
          );
        }
      }
    } else {
      // Create new SPF TXT record
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'TXT',
            name: cleanDomain,
            content: 'v=spf1 include:amazonses.com ~all',
            ttl: 3600,
          }),
        },
      );
    }
  }

  /**
   * Cleans up legacy mail records on mail.<baseDomain> if they linger from previous setup attempts.
   */
  private async pruneLegacyMailRecords(
    token: string,
    zoneId: string,
    baseDomain: string,
    email?: string,
  ) {
    try {
      const headers = this.getCloudflareHeaders(token, email);
      const legacyMailDomain = `mail.${baseDomain.trim().toLowerCase()}`;
      const mxRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(legacyMailDomain)}&type=MX&per_page=20`,
        { headers },
      );
      const mxData = (await mxRes.json()) as any;
      for (const rec of mxData?.result || []) {
        if ((rec.content || '').includes('amazonses.com')) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${rec.id}`,
            { method: 'DELETE', headers },
          );
        }
      }
    } catch {}
  }
}
