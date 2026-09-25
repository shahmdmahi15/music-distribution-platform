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
      // Maps an opaque token handed to the client back to the user whose password
      // was just verified, so the second step never has to trust a supplied id.
      mfaChallenge: {
        key: (token: string) => `platform:user:2fa-challenge:${token}`,
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
  whitelabel: {
    user: {
      verification: {
        key: (token: string) => `whitelabel:user:verification:${token}`,
        ttl: 3600, // 1 hour
      },
      mfa: {
        key: (userId: string) => `whitelabel:user:2fa:${userId}`,
        ttl: 300, // 5 min
      },
      mfaChallenge: {
        key: (token: string) => `whitelabel:user:2fa-challenge:${token}`,
        ttl: 300, // 5 min
      },
      passwordReset: {
        key: (token: string) => `whitelabel:user:password-reset:${token}`,
        ttl: 3600, // 1 hour
      },
      badResetToken: {
        key: (token: string) => `whitelabel:user:bad-reset-tokens:${token}`,
        ttl: 300, // 5 min
      },
    },
  },
};
