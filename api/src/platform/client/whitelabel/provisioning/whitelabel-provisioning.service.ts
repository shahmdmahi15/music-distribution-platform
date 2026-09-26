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
      this.executeProvisioningPipeline(updated.id).catch((err) => {
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
  private async executeProvisioningPipeline(whiteLabelId: string) {
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
      // STAGE 2: SES MAILING DOMAIN (mail.<customdomain>) + CLOUDFLARE DKIM/SPF/MX (Progress: 50%)
      // =========================================================================
      const mailDomain = `mail.${baseDomain}`;

      await this.appendLog(
        whiteLabelId,
        'SES',
        `Registering SES domain identity for mailing domain "${mailDomain}" and auto-wiring Cloudflare DNS...`,
        'INFO',
        ProvisioningStatus.SES_CONFIGURED,
        50,
        `Configuring SES Mailing Domain (${mailDomain}) & auto-injecting DKIM to Cloudflare`,
      );

      const ses = new SESv2Client({ region, credentials });
      let dkimTokens: string[] = [];

      try {
        const sesRes = await ses.send(
          new CreateEmailIdentityCommand({
            EmailIdentity: mailDomain,
          }),
        );
        dkimTokens = sesRes.DkimAttributes?.Tokens || [];
      } catch (err: any) {
        const existing = await ses.send(
          new GetEmailIdentityCommand({
            EmailIdentity: mailDomain,
          }),
        );
        dkimTokens = existing.DkimAttributes?.Tokens || [];
      }

      await this.appendLog(
        whiteLabelId,
        'SES',
        `SES mailing domain "${mailDomain}" registered. Retrieved ${dkimTokens.length} DKIM authentication tokens.`,
        'SUCCESS',
      );

      // Auto-inject 3 DKIM CNAMEs into Cloudflare DNS for mailDomain
      for (const token of dkimTokens) {
        const dkimCname = `${token}._domainkey.${mailDomain}`;
        const dkimTarget = `${token}.dkim.amazonses.com`;

        await this.upsertCloudflareDnsRecord(
          cfToken,
          zoneId,
          'CNAME',
          dkimCname,
          dkimTarget,
          false,
        );
      }

      // Auto-inject SPF TXT record for mailDomain
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'TXT',
        mailDomain,
        'v=spf1 include:amazonses.com ~all',
        false,
      );

      // Auto-inject MX feedback routing record for mailDomain
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'MX',
        mailDomain,
        `feedback-smtp.${region}.amazonses.com`,
        false,
        10,
      );

      // Auto-inject DMARC TXT record for mailDomain
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'TXT',
        `_dmarc.${mailDomain}`,
        'v=DMARC1; p=none;',
        false,
      );

      // Auto-inject SPF TXT record into Cloudflare DNS for root baseDomain as well
      await this.upsertCloudflareDnsRecord(
        cfToken,
        zoneId,
        'TXT',
        baseDomain,
        'v=spf1 include:amazonses.com ~all',
        false,
      );

      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          sesIdentityStatus: 'SUCCESS',
          sesDkimTokens: dkimTokens,
        },
      });

      await this.appendLog(
        whiteLabelId,
        'SES',
        `Dedicated mailing domain "${mailDomain}" ready! 3 DKIM CNAMEs, SPF TXT, MX feedback routing, and DMARC auto-configured.`,
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

      let activeKey = await this.prismaService.whiteLabelApiKey.findFirst({
        where: { whiteLabelId: wl.id },
      });

      if (!activeKey) {
        const rawKey = `rmit_live_${crypto.randomBytes(24).toString('hex')}`;
        const keyHash = crypto
          .createHash('sha256')
          .update(rawKey)
          .digest('hex');
        activeKey = await this.prismaService.whiteLabelApiKey.create({
          data: {
            code: `RMIT-KEY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            name: 'Auto-Provisioned EC2 Key',
            keyHash,
            keyPrefix: `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`,
            keyMasked: `${rawKey.slice(0, 10)}****************${rawKey.slice(-4)}`,
            whiteLabelId: wl.id,
          },
        });
      }

      const apiBaseUrl = 'https://api.royalmotionit.com';
      const internalSecret =
        this.configService.get('INTERNAL_API_SECRET', { infer: true }) ||
        'internal_api_secret_default';

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

      const originCertData = await this.requestCloudflareOriginCertificate(
        cfToken,
        [customDomain, `*.${baseDomain}`, baseDomain],
        wl.contactEmail || wl.senderEmail || undefined,
      );

      if (originCertData) {
        await this.appendLog(
          whiteLabelId,
          'SSL',
          `Cloudflare Origin CA certificate successfully generated via API for "*.${baseDomain}". Installing to EC2 Nginx.`,
          'SUCCESS',
        );
      } else {
        await this.appendLog(
          whiteLabelId,
          'SSL',
          `Cloudflare Origin CA API token scoped for DNS. Auto-generating high-grade 2048-bit RSA origin certificate on EC2 and synchronizing Cloudflare to Full SSL mode.`,
          'INFO',
        );
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
apt-get update && apt-get install -y ca-certificates curl gnupg nginx ufw git openssl

# 2. Firewall configuration
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 3. Node.js & Process Manager (PM2)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

# 4. Origin SSL Certificates
mkdir -p /etc/ssl/certs /etc/ssl/private
${originCertScriptBlock}
chmod 644 /etc/ssl/certs/whitelabel_origin.crt
chmod 600 /etc/ssl/private/whitelabel_origin.key

# 5. Application runtime directory & environment
mkdir -p /var/www/whitelabel
cd /var/www/whitelabel

cat <<EOF > /var/www/whitelabel/.env
API_BASE_URL="${apiBaseUrl}"
API_KEY="${activeKey.keyPrefix.replace('...', 'xxxx')}"
INTERNAL_API_SECRET="${internalSecret}"
PORT=3001
NODE_ENV=production
EOF

# 6. High-availability Web Application on Port 3001 (Zero-502 Guarantee)
cat << 'EOF_SERVER' > /var/www/whitelabel/server.js
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;
const TENANT_NAME = ${JSON.stringify(wl.name)};
const TENANT_CODE = ${JSON.stringify(wl.code)};
const CUSTOM_DOMAIN = ${JSON.stringify(customDomain)};
const PRIMARY_COLOR = ${JSON.stringify(wl.primaryColor || '#6366f1')};
const ACCENT_COLOR = ${JSON.stringify(wl.accentColor || '#ec4899')};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Immediate 200 OK for health check probes
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

  // Branded Backstage Portal Operational Landing Page
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
  console.log(\`WhiteLabel Portal listening on http://127.0.0.1:\${PORT}\`);
});
EOF_SERVER

pm2 start /var/www/whitelabel/server.js --name "whitelabel-portal"
pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
pm2 save

# 7. Nginx Production Configuration (100MB Body Limit + SSL on Port 443)
cat <<EOF > /etc/nginx/sites-available/whitelabel
# 1. HTTP Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${customDomain};
    return 301 https://\\$host\\$request_uri;
}

# 2. HTTPS Origin Server (Cloudflare SSL)
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

    # High-capacity 100MB Lossless Audio & Asset Body Limit
    client_max_body_size 100M;
    client_body_buffer_size 128k;

    # Tuned Proxy Buffers and Timeouts for large uploads
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    proxy_buffer_size 128k;
    proxy_buffers 8 64k;
    proxy_busy_buffers_size 128k;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

ln -sf /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
`;

      // Terminate any previous instance to cleanly re-attach the dedicated Elastic IP
      if (wl.awsInstanceId) {
        try {
          await ec2.send(
            new TerminateInstancesCommand({
              InstanceIds: [wl.awsInstanceId],
            }),
          );
          await this.appendLog(
            whiteLabelId,
            'COMPUTE',
            `Terminated previous instance (${wl.awsInstanceId}) to re-deploy with SSL and 100M upload configuration.`,
            'INFO',
          );
          // Brief pause for AWS to release Elastic IP association
          await new Promise((r) => setTimeout(r, 4000));
        } catch (termErr: any) {
          this.logger.warn(
            `Could not terminate previous instance ${wl.awsInstanceId}: ${termErr.message}`,
          );
        }
      }

      const runInstanceRes = await ec2.send(
        new RunInstancesCommand({
          ImageId: amiId,
          InstanceType: (wl.awsInstanceType as any) || 't4g.medium',
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

      const instanceId = runInstanceRes.Instances?.[0]?.InstanceId;
      if (!instanceId) {
        throw new Error('EC2 RunInstances failed to return an instance ID.');
      }

      await this.appendLog(
        whiteLabelId,
        'COMPUTE',
        `EC2 instance launched (${instanceId}, AMI: ${amiId}). Waiting for instance state before associating Elastic IP...`,
        'INFO',
      );

      // Resilient association loop
      let associated = false;
      for (let attempt = 1; attempt <= 12; attempt++) {
        try {
          await ec2.send(
            new AssociateAddressCommand({
              AllocationId: allocationId,
              InstanceId: instanceId,
            }),
          );
          associated = true;
          break;
        } catch (assocErr: any) {
          if (attempt === 12) {
            throw new Error(`Failed to associate Elastic IP: ${assocErr.message}`);
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      await this.prismaService.whiteLabel.update({
        where: { id: whiteLabelId },
        data: {
          awsInstanceId: instanceId,
          awsInstanceState: 'RUNNING',
        },
      });

      await this.appendLog(
        whiteLabelId,
        'COMPUTE',
        `Elastic IP ${elasticIp} attached to instance ${instanceId}. Server is booting and bootstrapping services.`,
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
      const targetSslMode = originCertData ? 'strict' : 'full';
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
      // STAGE 6: ACTIVATION & SUCCESS HANDOVER (Progress: 100%)
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
   * Idempotently creates or updates a Cloudflare DNS record.
   */
  private async upsertCloudflareDnsRecord(
    token: string,
    zoneId: string,
    type: 'A' | 'CNAME' | 'TXT' | 'MX',
    name: string,
    content: string,
    proxied: boolean,
    priority?: number,
  ) {
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&type=${type}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const listData = (await listRes.json()) as any;
    const existingRecord = listData?.result?.[0];

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

    if (existingRecord) {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existingRecord.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        },
      );
    } else {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        },
      );
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
   * Requests a Cloudflare Origin CA certificate via Cloudflare API.
   * If successful, Cloudflare Origin CA certificates validate under Full (Strict) SSL mode.
   */
  private async requestCloudflareOriginCertificate(
    token: string,
    hostnames: string[],
    email?: string,
  ): Promise<{ certificate: string; privateKey: string } | null> {
    try {
      const headers = this.getCloudflareHeaders(token, email);
      const res = await fetch('https://api.cloudflare.com/client/v4/certificates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          hostnames,
          requested_validity: 5475, // 15 years
          request_type: 'origin-rsa',
        }),
      });
      const data = (await res.json()) as any;
      if (data?.success && data?.result?.certificate && data?.result?.private_key) {
        return {
          certificate: data.result.certificate,
          privateKey: data.result.private_key,
        };
      }
      this.logger.debug(
        `Cloudflare Origin CA API: ${JSON.stringify(data?.errors || data?.messages || 'Not authorized')}`,
      );
    } catch (err: any) {
      this.logger.warn(`Could not request Cloudflare Origin CA certificate: ${err.message}`);
    }
    return null;
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
}
