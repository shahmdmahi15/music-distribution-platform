export interface AnsEnvelope<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  errorMessages?: Array<{
    message: string;
    path?: string;
  }>;
}

export interface AnsMeResponse {
  accountId: string;
  companyName: string;
  email: string;
  environment: 'test' | 'live';
  scopes: string[];
  createdAt: string;
}

export interface AnsUploadSingleRequest {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface AnsUploadSingleResponse {
  uploadId: string;
  signedUrl: string;
  storageKey: string;
  expiresAt: string;
}

export interface AnsUploadMultipartStartRequest {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  partCount: number;
}

export interface AnsUploadMultipartStartResponse {
  uploadId: string;
  storageKey: string;
  partSize: number;
  totalParts: number;
}

export interface AnsUploadMultipartSignPartsRequest {
  uploadId: string;
  partNumbers: number[];
}

export interface AnsUploadMultipartSignPartsResponse {
  parts: Array<{
    partNumber: number;
    signedUrl: string;
    expiresAt: string;
  }>;
}

export interface AnsUploadMultipartCompleteRequest {
  uploadId: string;
  parts: Array<{
    PartNumber: number;
    ETag: string;
  }>;
}

export interface AnsContributorInput {
  name: string;
  role: string;
}

export interface AnsTrackInput {
  externalId?: string;
  trackNumber: number;
  discNumber?: number;
  title: string;
  version?: string;
  durationSeconds: number;
  audioUrl?: string;
  isrc?: string;
  explicit: boolean;
  contributors: AnsContributorInput[];
}

export interface AnsReleaseInput {
  externalId?: string;
  title: string;
  type: 'SINGLE' | 'ALBUM' | 'EP' | 'MUSIC_VIDEO';
  genre: string;
  subgenre?: string;
  language?: string;
  releaseDate: string;
  cLine: string;
  pLine: string;
  upc?: string;
  coverArtUrl: string;
  channel?: string;
  videoUrl?: string;
  videoVersion?:
    | 'OFFICIAL'
    | 'LYRIC'
    | 'AUDIO'
    | 'LIVE'
    | 'INTERVIEW'
    | 'BEHIND_THE_SCENES'
    | 'TEASER'
    | 'ORIGINAL';
  tracks: AnsTrackInput[];
  contributors: AnsContributorInput[];
}

export type AnsReleasePatch = Partial<AnsReleaseInput>;

export interface AnsRelease {
  id: string;
  videoId?: string;
  externalId?: string;
  title: string;
  status:
    | 'PENDING'
    | 'NEEDS_FIX'
    | 'APPROVED'
    | 'DELIVERED'
    | 'REJECTED'
    | 'TAKEN_DOWN';
  reason?: string;
  upc?: string;
  youtubeVideoId?: string;
  videoUrl?: string;
  tracks?: Array<{
    id: string;
    externalId?: string;
    isrc?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  isDuplicate?: boolean;
}

export interface AnsChannelRequest {
  externalId?: string;
  channelName: string;
  artistName: string;
  artistBio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface AnsChannel {
  id: string;
  externalId?: string;
  channelName: string;
  artistName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  channelUrl?: string;
  youtubeChannelId?: string;
  createdAt?: string;
  submittedAt?: string;
  isDuplicate?: boolean;
}

export interface AnsWebhookEvent<T = any> {
  id: string;
  type: string;
  environment?: 'test' | 'live';
  timestamp: number;
  data: T;
}
