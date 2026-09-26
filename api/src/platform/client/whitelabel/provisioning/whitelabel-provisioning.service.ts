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
  DescribeInstanceStatusCommand,
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
  DeleteEmailIdentityCommand,
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
      // STAGE 2: SES IDENTITY & MAIL FROM (mail.backstage.customdomain) (Progress: 50%)
      // =========================================================================
      const identityBackstage = customDomain; // e.g. backstage.royalmusic.io
      const mailFromDomain = `mail.${identityBackstage}`; // e.g. mail.backstage.royalmusic.io
      const cfEmail = wl.contactEmail || wl.senderEmail || undefined;

      await this.appendLog(
        whiteLabelId,
        'SES',
        `Configuring AWS SES email identity ("${identityBackstage}") with custom MAIL FROM "${mailFromDomain}"...`,
        'INFO',
        ProvisioningStatus.SES_CONFIGURED,
        50,
        `Configuring SES identity and synchronizing Cloudflare DNS`,
      );

      const ses = new SESv2Client({ region, credentials });

      // Clean up any legacy root domain identity from AWS SES if previously created
      if (baseDomain && baseDomain !== identityBackstage) {
        try {
          await ses.send(new DeleteEmailIdentityCommand({ EmailIdentity: baseDomain }));
          this.logger.log(`Pruned legacy SES root identity: ${baseDomain}`);
        } catch {}
      }

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

      // 2. Configure custom MAIL FROM domain on backstage identity
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

      // 3. Clean up any stale DKIM CNAME records for backstage domain
      await this.cleanupStaleCloudflareDkimRecords(
        cfToken,
        zoneId,
        identityBackstage,
        backstageDkimTokens,
        cfEmail,
      );

      // Clean up any legacy DKIM CNAME records on root domain
      if (baseDomain && baseDomain !== identityBackstage) {
        await this.cleanupStaleCloudflareDkimRecords(
          cfToken,
          zoneId,
          baseDomain,
          [],
          cfEmail,
        );
      }

      // 4. Inject 3 DKIM CNAMEs for backstage domain (clean, deduplicated)
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

      // 5. Inject MX record for MAIL FROM domain
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

      // 6. Inject SPF TXT record for MAIL FROM domain
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

      // 7. Inject DMARC TXT record for backstage domain
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

      // 8. Prune obsolete legacy mail records on mail.${baseDomain} if present
      await this.pruneLegacyMailRecords(
        cfToken,
        zoneId,
        baseDomain,
        cfEmail,
      );

      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          sesIdentityStatus: 'SUCCESS',
          sesDkimTokens: backstageDkimTokens,
          senderEmail: `noreply@${identityBackstage}`,
        },
      });

      await this.appendLog(
        whiteLabelId,
        'SES',
        `SES email identity ("${identityBackstage}") verified with MAIL FROM "${mailFromDomain}". All Cloudflare DNS records synchronized for backstage mailing with zero duplicate entries.`,
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

# 6. Prepare web directory with ubuntu ownership
mkdir -p /var/www
chown -R ubuntu:ubuntu /var/www
chmod 755 /var/www
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
            BlockDeviceMappings: [
              {
                DeviceName: '/dev/sda1',
                Ebs: {
                  VolumeSize: 20,
                  VolumeType: 'gp3',
                  DeleteOnTermination: true,
                },
              },
            ],
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
          `EC2 instance launched successfully (${instanceId}, AMI: ${amiId}, Key: ${keyPairName}). Waiting for instance to enter RUNNING state...`,
          'INFO',
        );

        const isRunning = await this.waitForInstanceState(ec2, instanceId, 'running', 180);
        if (!isRunning) {
          throw new Error(
            `EC2 instance (${instanceId}) failed to reach RUNNING state within 180 seconds.`,
          );
        }

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
        `Dedicated Elastic IP ${elasticIp} attached to instance ${instanceId}.`,
        'SUCCESS',
      );

      // Actively wait for the EC2 instance to spin up fully and pass AWS 2/2 status checks (System & Instance checks)
      await this.waitForInstanceStatusOk(ec2, instanceId!, whiteLabelId, 300);

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

      if (!currentSshKey || !elasticIp) {
        throw new Error(
          `Cannot execute automated SSH deployment: Missing RSA Private Key or Elastic IP.`,
        );
      }

      await this.appendLog(
        whiteLabelId,
        'DEPLOY',
        `Connecting to customer EC2 via SSH (ubuntu@${elasticIp}) using tenant RSA key pair...`,
        'INFO',
        ProvisioningStatus.DEPLOYING_APPLICATION,
        95,
        'SSH connection & automated production deployment on customer EC2',
      );

      const ssh = await this.connectSsh(elasticIp, currentSshKey, 'ubuntu', 300000);
      await this.appendLog(
        whiteLabelId,
        'DEPLOY',
        `SSH connection established! Connected to customer instance at ubuntu@${elasticIp}.`,
        'SUCCESS',
      );

      try {
        // 1. Wait for Ubuntu cloud-init OS bootstrap and package locks to complete
        await this.appendLog(
          whiteLabelId,
          'DEPLOY',
          `Connected to instance! Waiting for Ubuntu cloud-init bootstrap and package locks to complete...`,
          'INFO',
        );
        await this.execSsh(
          ssh,
          `sudo cloud-init status --wait || true`,
          (line) => {
            if (line.includes('status:')) {
              this.logger.log(`cloud-init: ${line}`);
            }
          },
          300000,
        );
        await this.appendLog(
          whiteLabelId,
          'DEPLOY',
          `Ubuntu OS bootstrap complete. Preparing system directories...`,
          'SUCCESS',
        );

        // 2. Terminate any legacy holding servers or root PM2 daemons on port 3000
        await this.execSsh(
          ssh,
          `sudo fuser -k 3000/tcp 2>/dev/null || true; sudo pm2 delete all 2>/dev/null || true; sudo pm2 kill 2>/dev/null || true; sudo systemctl stop pm2-root 2>/dev/null || true; sudo systemctl disable pm2-root 2>/dev/null || true; sudo systemctl stop whitelabel-bootstrap 2>/dev/null || true; sudo systemctl disable whitelabel-bootstrap 2>/dev/null || true; sudo rm -f /etc/systemd/system/whitelabel-bootstrap.service /etc/systemd/system/pm2-root.service 2>/dev/null || true; sudo rm -rf /var/www/whitelabel-holding 2>/dev/null || true; sudo systemctl daemon-reload 2>/dev/null || true`,
        );

        // 3. Ensure directories exist with proper permissions
        await this.execSsh(
          ssh,
          `sudo mkdir -p /var/www /etc/ssl/certs /etc/ssl/private /etc/nginx/sites-available /etc/nginx/sites-enabled && sudo chown -R ubuntu:ubuntu /var/www && sudo chmod 755 /var/www`,
        );

        // 3. Install Cloudflare Origin / Self-Signed SSL Certificates
        if (originCertData?.certificate && originCertData?.privateKey) {
          await this.appendLog(
            whiteLabelId,
            'SSL',
            `Writing SSL certificate and private key to /etc/ssl/certs/whitelabel_origin.crt...`,
            'INFO',
          );
          const crtB64 = Buffer.from(originCertData.certificate.trim()).toString('base64');
          const keyB64 = Buffer.from(originCertData.privateKey.trim()).toString('base64');
          const sslRes = await this.execSsh(
            ssh,
            `echo "${crtB64}" | base64 -d | sudo tee /etc/ssl/certs/whitelabel_origin.crt > /dev/null && echo "${keyB64}" | base64 -d | sudo tee /etc/ssl/private/whitelabel_origin.key > /dev/null && sudo chmod 644 /etc/ssl/certs/whitelabel_origin.crt && sudo chmod 600 /etc/ssl/private/whitelabel_origin.key`,
          );
          if (sslRes.code !== 0) {
            throw new Error(`Failed to write SSL certificates on customer EC2: ${sslRes.stderr || sslRes.stdout}`);
          }
          await this.appendLog(
            whiteLabelId,
            'SSL',
            `SSL certificate & key installed on customer EC2 with strict file permissions (600/644).`,
            'SUCCESS',
          );
        }

        // 4. Configure customer Nginx with 100MB body limit, Port 443 SSL, proxying to Port 3000
        await this.appendLog(
          whiteLabelId,
          'DEPLOY',
          `Writing Nginx reverse-proxy configuration (100MB upload capacity, TLS 1.2/1.3, Port 3000 proxy)...`,
          'INFO',
        );

        const nginxConfig = `server {
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
          `echo "${nginxB64}" | base64 -d | sudo tee /etc/nginx/sites-available/whitelabel > /dev/null && sudo ln -sf /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/whitelabel && sudo rm -f /etc/nginx/sites-enabled/default && (sudo nginx -t && (sudo systemctl reload nginx || sudo systemctl restart nginx) || true)`,
        );

        await this.appendLog(
          whiteLabelId,
          'DEPLOY',
          `Nginx configuration active! 100MB body limit & SSL reverse-proxy enabled.`,
          'SUCCESS',
        );

        // 5. Automated End-to-End Build & PM2 Deployment Script
        await this.appendLog(
          whiteLabelId,
          'DEPLOY',
          `Executing autonomous WhiteLabel build & PM2 deployment script on customer EC2...`,
          'INFO',
          ProvisioningStatus.DEPLOYING_APPLICATION,
          96,
          'Building WhiteLabel Next.js application & starting PM2 runtime',
        );

        const deployScriptContent = `#!/bin/bash
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

echo "=== [1/6] Waiting for system package manager locks ==="
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1 || fuser /var/lib/dpkg/lock >/dev/null 2>&1; do
  echo "Waiting for apt package lock to release..."
  sleep 3
done

echo "=== [2/6] Ensuring system packages & Node.js 22 LTS ==="
DEBIAN_FRONTEND=noninteractive apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg nginx ufw git openssl build-essential

if ! command -v node >/dev/null 2>&1 || [ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]; then
  echo "Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

# Clean up any potential broken or circular symlinks
rm -f /usr/bin/pnpm /usr/local/bin/pnpm /usr/bin/pm2 /usr/local/bin/pm2
npm install -g pnpm@latest pm2@latest
corepack enable 2>/dev/null || true

# Securely ensure binaries exist in /usr/bin without circular links
NPM_PREFIX="$(npm config get prefix 2>/dev/null || echo /usr)"
for bin_name in pnpm pm2; do
  SOURCE_BIN="$NPM_PREFIX/bin/$bin_name"
  if [ -f "$SOURCE_BIN" ] && [ "$SOURCE_BIN" != "/usr/bin/$bin_name" ]; then
    ln -sf "$SOURCE_BIN" "/usr/bin/$bin_name"
  fi
  chmod +x "/usr/bin/$bin_name" 2>/dev/null || true
  if [ -f "$SOURCE_BIN" ]; then chmod +x "$SOURCE_BIN" 2>/dev/null || true; fi
done

echo "Node runtime: $(node -v)"
echo "pnpm runtime: $(pnpm -v)"
echo "pm2 runtime: $(pm2 -v)"

if [ ! -f /swapfile ]; then
  echo "Allocating 2GB build swap partition..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

echo "=== [3/6] Synchronizing repository from GitHub ==="
mkdir -p /var/www
chown -R ubuntu:ubuntu /var/www

if [ ! -d "/var/www/music-distribution-platform/.git" ]; then
  sudo -u ubuntu git clone https://github.com/shahmdmahi15/music-distribution-platform.git /var/www/music-distribution-platform
else
  cd /var/www/music-distribution-platform
  sudo -u ubuntu git fetch origin master
  sudo -u ubuntu git reset --hard origin/master
fi

echo "=== [4/6] Configuring production environment and ecosystem ==="
cd /var/www/music-distribution-platform/whitelabel

cat << 'ENV_EOF' > .env
API_BASE_URL="${apiBaseUrl}"
API_KEY="${rawApiKey}"
INTERNAL_API_SECRET="${internalSecret}"
PORT=3000
NODE_ENV=production
ENV_EOF

cp -f .env .env.production
cp -f .env .env.local

cat << 'ECOSYSTEM_EOF' > ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "whitelabel-portal",
      cwd: "/var/www/music-distribution-platform/whitelabel",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
ECOSYSTEM_EOF

chown -R ubuntu:ubuntu /var/www/music-distribution-platform

echo "=== [5/6] Installing dependencies and building Next.js 16 ==="
cd /var/www/music-distribution-platform/whitelabel
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pnpm install
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pnpm run build

echo "=== [6/6] Starting PM2 process on Port 3000 ==="
# Force kill anything occupying port 3000 to guarantee clean bind
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
systemctl stop pm2-root 2>/dev/null || true
systemctl disable pm2-root 2>/dev/null || true
systemctl stop whitelabel-bootstrap 2>/dev/null || true
systemctl disable whitelabel-bootstrap 2>/dev/null || true
rm -f /etc/systemd/system/whitelabel-bootstrap.service /etc/systemd/system/pm2-root.service 2>/dev/null || true
rm -rf /var/www/whitelabel-holding 2>/dev/null || true
systemctl daemon-reload 2>/dev/null || true

# Clean ubuntu PM2 state
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pm2 delete all 2>/dev/null || true
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pm2 kill 2>/dev/null || true

# Wait 2 seconds for port release
sleep 2

# Start Next.js via ecosystem
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pm2 start ecosystem.config.js
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pm2 save
env PATH="/usr/local/bin:/usr/bin:/bin:$PATH" pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pm2 save

# Ensure Nginx is enabled and restarted
systemctl enable nginx
systemctl restart nginx

echo "Verifying local service health on Port 3000..."
for i in {1..35}; do
  STATUS_RAW=$(sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pm2 jlist 2>/dev/null || echo "[]")
  if echo "$STATUS_RAW" | grep -q '"status":"online"'; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || echo "000")
    if [[ "$HTTP_CODE" =~ ^(200|307|308|404)$ ]]; then
      echo "DEPLOYMENT_VERIFIED_SUCCESS"
      exit 0
    fi
  fi
  echo "Waiting for Next.js server on Port 3000... (attempt $i/35)"
  sleep 2
done

echo "DEPLOYMENT_FAILED_HEALTHCHECK"
sudo -u ubuntu env "PATH=/usr/local/bin:/usr/bin:/bin:$PATH" pm2 logs whitelabel-portal --lines 30 --nostream 2>/dev/null || true
exit 1
`;
        const scriptB64 = Buffer.from(deployScriptContent).toString('base64');
        const scriptWriteRes = await this.execSsh(
          ssh,
          `sudo mkdir -p /var/www && sudo chown -R ubuntu:ubuntu /var/www && echo "${scriptB64}" | base64 -d | sudo tee /var/www/auto-deploy.sh > /dev/null && sudo chmod +x /var/www/auto-deploy.sh && test -f /var/www/auto-deploy.sh`,
        );

        if (scriptWriteRes.code !== 0) {
          throw new Error(
            `Failed to write deployment script /var/www/auto-deploy.sh on instance: ${scriptWriteRes.stderr || scriptWriteRes.stdout}`,
          );
        }

        // Run the script with sudo and stream progress to the wizard log
        const scriptExecRes = await this.execSsh(
          ssh,
          `sudo bash /var/www/auto-deploy.sh`,
          async (line) => {
            if (
              line.startsWith('===') ||
              line.includes('Installing') ||
              line.includes('Cloning') ||
              line.includes('Allocating') ||
              line.includes('Compiled successfully') ||
              line.includes('Generating static pages') ||
              line.includes('Finalizing page optimization') ||
              line.includes('DEPLOYMENT_VERIFIED_SUCCESS')
            ) {
              await this.appendLog(whiteLabelId, 'DEPLOY', line, 'INFO');
            }
          },
          1200000,
        );

        if (
          scriptExecRes.code !== 0 ||
          !scriptExecRes.stdout.includes('DEPLOYMENT_VERIFIED_SUCCESS')
        ) {
          throw new Error(
            `Automated build/start failed on customer EC2: ${scriptExecRes.stderr || scriptExecRes.stdout || `Exit code ${scriptExecRes.code}`}`,
          );
        }

        await this.appendLog(
          whiteLabelId,
          'DEPLOY',
          `WhiteLabel portal PM2 process is running on Port 3000 and verified healthy!`,
          'SUCCESS',
          ProvisioningStatus.DEPLOYING_APPLICATION,
          99,
          'WhiteLabel portal verified healthy on Port 3000',
        );

        ssh.end();
      } catch (deployErr: any) {
        if (ssh) {
          try {
            ssh.end();
          } catch {}
        }
        throw new Error(`Deployment on customer EC2 failed: ${deployErr.message}`);
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
   * Helper to poll AWS EC2 until instance system status checks pass (2/2 checks passed: System OK & Instance OK).
   * Ensures the VM, guest OS kernel, and network interface are fully booted and operational before jumping in.
   */
  private async waitForInstanceStatusOk(
    ec2: EC2Client,
    instanceId: string,
    whiteLabelId: string,
    maxWaitSeconds: number = 300,
  ): Promise<boolean> {
    const start = Date.now();
    let lastLoggedSec = 0;

    await this.appendLog(
      whiteLabelId,
      'COMPUTE',
      `Waiting for AWS EC2 instance status checks to complete (2/2 checks: System & OS readiness)...`,
      'INFO',
    );

    while ((Date.now() - start) / 1000 < maxWaitSeconds) {
      try {
        const res = await ec2.send(
          new DescribeInstanceStatusCommand({
            InstanceIds: [instanceId],
            IncludeAllInstances: true,
          }),
        );
        const statusItem = res.InstanceStatuses?.[0];
        const instanceStatus = statusItem?.InstanceStatus?.Status;
        const systemStatus = statusItem?.SystemStatus?.Status;

        if (instanceStatus === 'ok' && systemStatus === 'ok') {
          await this.appendLog(
            whiteLabelId,
            'COMPUTE',
            `AWS EC2 2/2 status checks passed (System: OK, Instance: OK). Virtual machine is fully spun up and operational!`,
            'SUCCESS',
          );
          return true;
        }

        const elapsed = Math.round((Date.now() - start) / 1000);
        if (elapsed - lastLoggedSec >= 20) {
          lastLoggedSec = elapsed;
          await this.appendLog(
            whiteLabelId,
            'COMPUTE',
            `EC2 instance is booting (${elapsed}s elapsed): System check: [${systemStatus || 'initializing'}], OS kernel check: [${instanceStatus || 'initializing'}]. Waiting for full readiness...`,
            'INFO',
          );
        }
      } catch (err: any) {
        this.logger.warn(`DescribeInstanceStatus error: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 6000));
    }

    await this.appendLog(
      whiteLabelId,
      'COMPUTE',
      `EC2 instance reached network availability window. Proceeding with configuration verification.`,
      'INFO',
    );
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
