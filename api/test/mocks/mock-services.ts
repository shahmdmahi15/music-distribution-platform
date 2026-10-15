export const createMockPrismaService = () => ({
  platformUser: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  whiteLabel: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  whiteLabelUser: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  whiteLabelApiKey: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  release: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  track: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  releaseContributor: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  trackContributor: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  trackAudioScan: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  distributionReport: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((callback) => (typeof callback === 'function' ? callback(this) : Promise.all(callback))),
  $executeRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
});

export const createMockRedisService = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  hget: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(1),
  hdel: jest.fn().mockResolvedValue(1),
});

export const createMockStorageService = () => ({
  uploadFileBuffer: jest.fn().mockResolvedValue('https://storage.example.com/file.jpg'),
  getSignedFileUrl: jest.fn().mockResolvedValue('https://storage.example.com/signed-url'),
  getPresignedUrl: jest.fn().mockResolvedValue('https://storage.example.com/presigned-url'),
  getPresignedUploadUrl: jest.fn().mockResolvedValue('https://storage.example.com/presigned-upload-url'),
  getFileUrl: jest.fn((key: string) => `https://cdn.example.com/${key}`),
  getFileBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-audio-data')),
  deleteFile: jest.fn().mockResolvedValue(undefined),
});

export const createMockMailService = () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendInvitationEmail: jest.fn().mockResolvedValue(true),
  send2faCodeEmail: jest.fn().mockResolvedValue(true),
  sendTwoFactorTokenEmail: jest.fn().mockResolvedValue(true),
  sendWhiteLabelPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWhiteLabel2faCodeEmail: jest.fn().mockResolvedValue(true),
});

export const createMockCloudflareDnsService = () => ({
  isSubdomainEmpty: jest.fn().mockResolvedValue(true),
  provisionSubdomain: jest.fn().mockResolvedValue({
    success: true,
    message: 'DNS Record Provisioned',
    fqdn: 'label.platform.royalmotionit.com',
    configured: true,
  }),
  deleteSubdomainRecord: jest.fn().mockResolvedValue({ success: true }),
  verifySubdomainDns: jest.fn().mockResolvedValue({
    success: true,
    fqdn: 'label.platform.royalmotionit.com',
    status: 'ACTIVE',
  }),
});

export const createMockConfigService = (env: Record<string, any> = {}) => ({
  get: jest.fn((key: string) => env[key] ?? null),
  getOrThrow: jest.fn((key: string) => {
    if (env[key] !== undefined) return env[key];
    throw new Error(`Config key "${key}" not found.`);
  }),
});

export const createMockAcrCloudService = () => ({
  identifyAudio: jest.fn().mockResolvedValue({
    statusCode: 1001,
    statusMsg: 'No result',
    isClean: true,
    hasMatch: false,
  }),
  scanTrack: jest.fn().mockResolvedValue({
    id: 'mock-scan-id',
    status: 'CLEAN',
    matchScore: null,
    scannedAt: new Date(),
  }),
  scanTrackByCode: jest.fn().mockResolvedValue({
    id: 'mock-scan-id',
    status: 'CLEAN',
    matchScore: null,
    scannedAt: new Date(),
  }),
  generateSignature: jest.fn().mockReturnValue('mock-sig'),
  isConfigured: jest.fn().mockReturnValue(true),
});

