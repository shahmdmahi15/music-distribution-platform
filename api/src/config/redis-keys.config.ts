/**
 * Global Redis Cache Key Registry and TTLs (in seconds)
 */
export const REDIS_KEYS = {
  platform: {
    user: {
      verification: {
        key: (token: string) => `platform:user:verification:${token}`,
        ttl: 3600, // 1 hour
      },
      mfa: {
        key: (userId: string) => `platform:user:2fa:${userId}`,
        ttl: 300, // 5 min
      },
      passwordReset: {
        key: (token: string) => `platform:user:password-reset:${token}`,
        ttl: 3600, // 1hour
      },
      badResetToken: {
        key: (token: string) => `platform:user:bad-reset-tokens:${token}`,
        ttl: 300, // 5 min
      },
    },
  },
};
