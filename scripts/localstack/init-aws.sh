#!/usr/bin/env bash
set -eo pipefail

echo "=========================================="
echo "Initializing LocalStack AWS Resources..."
echo "=========================================="

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
BUCKET_NAME="${AWS_S3_BUCKET:-music-distribution-bucket}"
SENDER_EMAIL="${SENDER_EMAIL:-noreply@royalmotionit.com}"

# 1. Create S3 Bucket
echo "Creating S3 Bucket: $BUCKET_NAME in $REGION..."
awslocal --region "$REGION" s3 mb "s3://$BUCKET_NAME" || true

# 2. Configure CORS on S3 Bucket
echo "Configuring CORS on S3 Bucket: $BUCKET_NAME..."
awslocal --region "$REGION" s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
      }
    ]
  }'

# 3. Disable Public Access Block to allow public assets
echo "Configuring Public Access Block on S3 Bucket..."
awslocal --region "$REGION" s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration '{
    "BlockPublicAcls": false,
    "IgnorePublicAcls": false,
    "BlockPublicPolicy": false,
    "RestrictPublicBuckets": false
  }' || true

# 4. Verify SES Email Identity
echo "Verifying SES Email Identity: $SENDER_EMAIL..."
awslocal --region "$REGION" ses verify-email-identity --email-address "$SENDER_EMAIL" || true
awslocal --region "$REGION" sesv2 create-email-identity --email-identity "$SENDER_EMAIL" || true

echo "=========================================="
echo "LocalStack AWS Initialization Complete!"
echo "=========================================="
