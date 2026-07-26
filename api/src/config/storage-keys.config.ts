/**
 * Global storage keys
 */
export const STORAGE_KEYS = {
  platform: {
    users: {
      profile: {
        key: (userId: string, ext: string) =>
          `platform/users/profile/${userId}.${ext}`,
        limit: 1024 * 1024 * 1,
      },
    },
  },
};
