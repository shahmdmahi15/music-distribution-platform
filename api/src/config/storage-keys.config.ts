/**
 * Global storage keys
 */
export const STORAGE_KEYS = {
  platform: {
    users: {
      profile: {
        // The content hash is part of the key so that replacing an avatar yields
        // a new URL; public objects are cached immutably, so a stable key would
        // otherwise keep serving the old image.
        key: (userId: string, contentHash: string) =>
          `platform/users/profile/${userId}-${contentHash}`,
        limit: 1024 * 1024 * 1,
      },
    },
  },
};

/** `Cache-Control` for public objects whose key changes when content changes. */
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
