/**
 * Global storage keys
 */
export const STORAGE_KEYS = {
  platform: {
    users: {
      profile: {
        key: (userId: string) => `platform/users/profile/${userId}`,
        limit: 1024 * 1024 * 1,
      },
    },
  },
};
