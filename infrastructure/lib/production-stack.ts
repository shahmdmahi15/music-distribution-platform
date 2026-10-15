import * as cdk from 'aws-cdk-lib';
import {
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  CfnOutput,
} from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class RmitProductionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // =========================================================================
    // 1. VPC Networking (Multi-AZ with Public, Private & Isolated Subnets)
    // =========================================================================
    const vpc = new ec2.Vpc(this, 'RmitProductionVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 2, // High-availability redundant NAT Gateways across AZs
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'ApplicationPrivate',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'DatabaseIsolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs to CloudWatch Logs
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // =========================================================================
    // 2. KMS Customer Managed Keys (Least-Privilege Encryption at Rest)
    // =========================================================================
    const rdsKmsKey = new kms.Key(this, 'RmitRdsKmsKey', {
      description: 'Customer Managed Key for RMIT RDS PostgreSQL 16 encryption',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const s3KmsKey = new kms.Key(this, 'RmitS3KmsKey', {
      description: 'Customer Managed Key for RMIT S3 Master Audio Assets',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // =========================================================================
    // 3. Security Groups (Strict Least-Privilege Segmentation)
    // =========================================================================
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'ALB Security Group allowing HTTP/HTTPS ingress',
      allowAllOutbound: false,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from Internet',
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from Internet',
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsApiSecurityGroup', {
      vpc,
      description: 'ECS Fargate API Security Group',
      allowAllOutbound: true, // Requires egress to AWS APIs, Cloudflare, S3
    });
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(5000),
      'Allow traffic only from ALB on NestJS API port 5000',
    );
    albSecurityGroup.addEgressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5000),
      'Allow ALB to route traffic to ECS API instances',
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'PostgreSQL RDS Security Group strictly scoped to ECS API',
      allowAllOutbound: false,
    });
    rdsSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL connections only from ECS API tasks',
    );

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'ElastiCache Redis Security Group strictly scoped to ECS API',
      allowAllOutbound: false,
    });
    redisSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis connections only from ECS API tasks',
    );

    // =========================================================================
    // 4. Amazon RDS PostgreSQL 16 Multi-AZ (Isolated Subnets)
    // =========================================================================
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'RdsDbCredentialsSecret', {
      secretName: 'rmit/production/rds-credentials',
      description: 'Credentials for RMIT PostgreSQL 16 RDS Cluster',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'rmit_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    const databaseInstance = new rds.DatabaseInstance(this, 'RmitRdsPostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MEDIUM,
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      databaseName: 'rmit_production',
      multiAz: true,
      allocatedStorage: 50,
      maxAllocatedStorage: 500,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,
      backupRetention: Duration.days(30),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'Sun:04:30-Sun:05:30',
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      removalPolicy: RemovalPolicy.SNAPSHOT,
      publiclyAccessible: false,
    });

    // =========================================================================
    // 5. Amazon ElastiCache Redis Cluster (Isolated Subnets)
    // =========================================================================
    const redisAuthSecret = new secretsmanager.Secret(this, 'RedisAuthSecret', {
      secretName: 'rmit/production/redis-auth',
      description: 'Auth token for ElastiCache Redis replication group',
      generateSecretString: {
        passwordLength: 32,
        excludePunctuation: true,
      },
    });

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster in isolated subnets',
      subnetIds: vpc.isolatedSubnets.map((subnet) => subnet.subnetId),
      cacheSubnetGroupName: 'rmit-production-redis-subnets',
    });

    const redisReplicationGroup = new elasticache.CfnReplicationGroup(
      this,
      'RmitRedisReplicationGroup',
      {
        replicationGroupDescription: 'Production Redis Cluster for Caching and Session Management',
        engine: 'redis',
        engineVersion: '7.1',
        cacheNodeType: 'cache.t4g.medium',
        numCacheClusters: 2,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
        securityGroupIds: [redisSecurityGroup.securityGroupId],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        authToken: redisAuthSecret.secretValue.unsafeUnwrap(),
        autoMinorVersionUpgrade: true,
      },
    );
    redisReplicationGroup.addDependency(redisSubnetGroup);

    // =========================================================================
    // 6. Amazon S3 Storage & CloudFront CDN with Origin Access Control (OAC)
    // =========================================================================
    const mediaBucket = new s3.Bucket(this, 'RmitMediaBucket', {
      bucketName: `rmit-media-storage-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: [
            'https://platform.royalmotionit.com',
            'https://api.royalmotionit.com',
            'https://api.platform.royalmotionit.com',
          ],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag', 'x-amz-server-side-encryption'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(2),
        },
      ],
    });

    const mediaOrigin = origins.S3BucketOrigin.withOriginAccessControl(mediaBucket);

    const mediaDistribution = new cloudfront.Distribution(this, 'RmitMediaDistribution', {
      defaultBehavior: {
        origin: mediaOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      comment: 'CloudFront OAC Distribution for RMIT Audio Masters and Artwork Assets',
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'CloudFrontLogBucket', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        removalPolicy: RemovalPolicy.RETAIN,
      }),
      logFilePrefix: 'cloudfront-access-logs/',
    });

    // =========================================================================
    // 7. AWS ECS Fargate Cluster & Application Load Balancer
    // =========================================================================
    const ecsCluster = new ecs.Cluster(this, 'RmitEcsCluster', {
      vpc,
      clusterName: 'rmit-production-cluster',
      containerInsights: true,
    });

    const ecsExecutionRole = new iam.Role(this, 'EcsExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Least-privilege role for ECS agent container pulls and logs',
    });

    ecsExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'EcrPullPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      }),
    );

    ecsExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchLoggingPermissions',
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/ecs/rmit-api:*`,
        ],
      }),
    );

    ecsExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SecretsManagerAccess',
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          dbCredentialsSecret.secretArn,
          redisAuthSecret.secretArn,
        ],
      }),
    );

    const ecsTaskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Strict least-privilege runtime role for RMIT NestJS API',
    });

    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3MediaBucketAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:AbortMultipartUpload',
        ],
        resources: [`${mediaBucket.bucketArn}/*`],
      }),
    );
    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3MediaBucketList',
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [mediaBucket.bucketArn],
      }),
    );

    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'KmsKeyUsage',
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [s3KmsKey.keyArn, rdsKmsKey.keyArn],
      }),
    );

    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SesSendEmail',
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [
          `arn:aws:ses:${this.region}:${this.account}:identity/royalmotionit.com`,
        ],
      }),
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'RmitApiTaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      executionRole: ecsExecutionRole,
      taskRole: ecsTaskRole,
    });

    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/ecs/rmit-api',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const apiContainer = taskDefinition.addContainer('RmitApiContainer', {
      image: ecs.ContainerImage.fromRegistry(
        `${this.account}.dkr.ecr.${this.region}.amazonaws.com/rmit-api:latest`,
      ),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup: apiLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '5000',
        S3_BUCKET_NAME: mediaBucket.bucketName,
        CLOUDFRONT_DOMAIN: mediaDistribution.distributionDomainName,
        AWS_REGION: this.region,
      },
      secrets: {
        DB_CREDENTIALS: ecs.Secret.fromSecretsManager(dbCredentialsSecret),
        REDIS_AUTH: ecs.Secret.fromSecretsManager(redisAuthSecret),
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:5000/health || exit 1',
        ],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(15),
      },
    });

    apiContainer.addPortMappings({
      containerPort: 5000,
      protocol: ecs.Protocol.TCP,
    });

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'RmitAlbFargateService',
      {
        cluster: ecsCluster,
        taskDefinition,
        desiredCount: 2,
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [ecsSecurityGroup],
        publicLoadBalancer: true,
        listenerPort: 80,
        loadBalancer: new elbv2.ApplicationLoadBalancer(this, 'RmitAlb', {
          vpc,
          internetFacing: true,
          securityGroup: albSecurityGroup,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
          },
        }),
      },
    );

    fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200',
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    const autoScaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    autoScaling.scaleOnCpuUtilization('ApiCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    autoScaling.scaleOnMemoryUtilization('ApiMemoryScaling', {
      targetUtilizationPercent: 75,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // =========================================================================
    // 8. Stack Outputs
    // =========================================================================
    new CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for RMIT Production',
      exportName: 'RmitProductionVpcId',
    });

    new CfnOutput(this, 'RdsEndpoint', {
      value: databaseInstance.instanceEndpoint.hostname,
      description: 'PostgreSQL RDS Multi-AZ Endpoint',
      exportName: 'RmitRdsEndpoint',
    });

    new CfnOutput(this, 'RedisEndpoint', {
      value: redisReplicationGroup.attrPrimaryEndPointAddress,
      description: 'ElastiCache Redis Primary Endpoint',
      exportName: 'RmitRedisEndpoint',
    });

    new CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 Media Storage Bucket Name',
      exportName: 'RmitMediaBucketName',
    });

    new CfnOutput(this, 'CloudFrontDomainName', {
      value: mediaDistribution.distributionDomainName,
      description: 'CloudFront OAC CDN Domain Name',
      exportName: 'RmitCloudFrontDomain',
    });

    new CfnOutput(this, 'AlbDnsName', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer Public DNS',
      exportName: 'RmitAlbDnsName',
    });
  }
}
