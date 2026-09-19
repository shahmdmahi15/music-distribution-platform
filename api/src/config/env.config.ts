import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),
  REDIS_URL: z.url('REDIS_URL must be a valid URL'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  SENDER_EMAIL: z.email('SENDER_EMAIL must be a valid email address'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
  PLATFORM_API_KEY: z.string().min(1, 'PLATFORM_API_KEY is required'),
  WHITELABEL_API_KEY: z.string().optional(),
  INTERNAL_API_SECRET: z
    .string()
    .min(32, 'INTERNAL_API_SECRET must be at least 32 characters'),
  PLATFORM_URL: z.url('PLATFORM_URL must be a valid URL'),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_BASE_DOMAIN: z.string().default('platform.royalmotionit.com'),
  CLOUDFLARE_TARGET_CNAME: z.string().default('platform.royalmotionit.com'),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment validation failed');
  }

  return result.data;
}
