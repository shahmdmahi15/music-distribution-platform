#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RmitProductionStack } from '../lib/production-stack';

const app = new cdk.App();

const environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

new RmitProductionStack(app, 'RmitProductionStack', {
  env: environment,
  description: 'Production Multi-AZ Infrastructure for RoyalMotionIT Music Distribution Platform',
  tags: {
    Project: 'RoyalMotionIT',
    Environment: 'Production',
    ManagedBy: 'AWS-CDK',
  },
});

app.synth();
