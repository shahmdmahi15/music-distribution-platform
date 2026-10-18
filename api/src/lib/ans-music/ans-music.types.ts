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
  company: string;
  environment: 'live' | 'test';
  scopes: string[];
  linkedAccount?: { id: string; name: string };
  webhookUrl?: string;
  accountId?: string;
  companyName?: string;
  email?: string;
  createdAt?: string;
}

export type AnsVideoVersion =
  | 'official'
  | 'lyric'
  | 'audio'
  | 'live'
  | 'interview'
  | 'behind_the_scenes'
  | 'teaser'
  | 'original'
  | 'OFFICIAL'
  | 'LYRIC'
  | 'AUDIO'
  | 'LIVE'
  | 'INTERVIEW'
  | 'BEHIND_THE_SCENES'
  | 'TEASER'
  | 'ORIGINAL';

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
  // Nine mandatory fields per https://apidoc.ansmusic.io/
  title: string;
  primaryArtist: string[];
  videoUrl: string;
  imageUrl: string;
  label: string;
  genre: string[];
  language: string;
  description: string;
  channel: string;

  // Optional fields
  externalId?: string;
  featuringArtists?: string[];
  releaseDate?: string;
  releaseTimezone?: string;
  version?: AnsVideoVersion;
  upc?: string;
  isrc?: string;
  visibility?: 'public' | 'unlisted';
  explicit?: boolean;
  keywords?: string[];
  composer?: string;
  producer?: string;
  editor?: string;
  musicDirector?: string;
  copyrightYear?: string;

  // Backward compatibility fields for internal DDEX packaging
  type?: string;
  subgenre?: string;
  cLine?: string;
  pLine?: string;
  coverArtUrl?: string;
  videoVersion?: AnsVideoVersion;
  tracks?: AnsTrackInput[];
  contributors?: AnsContributorInput[];
}

export type AnsReleasePatch = Partial<AnsReleaseInput>;

export interface AnsRelease {
  id: string;
  videoId?: string;
  reference?: string;
  externalId: string | null;
  title: string;
  isrc?: string | null;
  isrcAssignedByAns?: boolean;
  upc?: string | null;
  upcAssignedByAns?: boolean;
  status:
    | 'pending'
    | 'needs_fix'
    | 'approved'
    | 'delivered'
    | 'rejected'
    | 'taken_down'
    | 'PENDING'
    | 'NEEDS_FIX'
    | 'APPROVED'
    | 'DELIVERED'
    | 'REJECTED'
    | 'TAKEN_DOWN';
  statusDetail?: string;
  reason?: string | null;
  primaryArtist?: string[];
  featuringArtists?: string[];
  label?: string | null;
  genre?: string[];
  releaseDate?: string | null;
  releaseTimezone?: string | null;
  version?: AnsVideoVersion | null;
  channel?: string | null;
  youtubeVideoId?: string | null;
  videoUrl?: string | null;
  language?: string | null;
  description?: string | null;
  keywords?: string[];
  composer?: string | null;
  producer?: string | null;
  editor?: string | null;
  musicDirector?: string | null;
  copyrightYear?: string | null;
  explicit?: boolean | null;
  visibility?: 'public' | 'unlisted';
  imageUrl?: string | null;
  environment?: 'live' | 'test';
  createdAt: string;
  updatedAt: string;
  warnings?: string[];
  tracks?: Array<{
    id: string;
    externalId?: string;
    isrc?: string;
  }>;
}

export interface AnsListReleasesQuery {
  updatedSince?: string;
  externalId?: string;
  isrc?: string;
  page?: number;
  limit?: number;
}

export interface AnsReleaseListResponse {
  releases: AnsRelease[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnsSimulateStatusRequest {
  status:
    | 'pending'
    | 'needs_fix'
    | 'approved'
    | 'delivered'
    | 'youtube_linked'
    | 'rejected'
    | 'taken_down';
  reason?: string;
}

export interface AnsChannelRequest {
  channelName: string;
  artistName?: string;
  description?: string;
  keywords?: string[];
  externalId?: string;
  artistBio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface AnsChannel {
  id: string;
  channelName: string;
  status: 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';
  channelUrl: string | null;
  youtubeChannelId: string | null;
  createdAt: string;
  updatedAt: string;
  externalId?: string;
  artistName?: string;
  submittedAt?: string;
}

export interface AnsChannelListResponse {
  channels: AnsChannel[];
}

export interface AnsUploadStartRequest {
  fileName: string;
  category?: 'video' | 'image';
  contentType?: string;
  size?: number;
  mimeType?: string;
  sizeBytes?: number;
}

export interface AnsUploadSingleResponse {
  mode: 'single';
  key: string;
  uploadUrl: string;
  fileUrl: string;
  uploadId?: string;
  signedUrl?: string;
  storageKey?: string;
  expiresAt?: string;
}

export interface AnsUploadMultipartResponse {
  mode: 'multipart';
  key: string;
  uploadId: string;
  partSize: number;
  fileUrl: string;
  totalParts?: number;
  storageKey?: string;
}

export type AnsUploadStartResponse =
  | AnsUploadSingleResponse
  | AnsUploadMultipartResponse;

export interface AnsUploadPartsRequest {
  key: string;
  uploadId: string;
  partNumbers: number[];
}

export interface AnsUploadPartsResponse {
  urls: Array<{
    partNumber: number;
    uploadUrl: string;
  }>;
  parts?: Array<{
    partNumber: number;
    signedUrl: string;
    expiresAt: string;
  }>;
}

export interface AnsUploadCompleteRequest {
  key: string;
  uploadId: string;
  parts: Array<{
    partNumber: number;
    eTag: string;
  }>;
}

export interface AnsUploadCompleteResponse {
  key: string;
  fileUrl: string;
  storageKey?: string;
  location?: string;
}

export interface AnsWebhookGetResponse {
  url: string;
  secretSet: boolean;
}

export interface AnsWebhookSetRequest {
  url: string;
  rotateSecret?: boolean;
}

export interface AnsWebhookSetResponse {
  url: string;
  secret: string | null;
  secretRotated: boolean;
  note?: string;
}

export interface AnsWebhookTestResponse {
  url: string;
  delivered: boolean;
  responseStatus: number | null;
  error?: string;
  sentBody?: any;
}

export interface AnsWebhookEvent<T = any> {
  id: string;
  event:
    | 'release.created'
    | 'release.needs_fix'
    | 'release.approved'
    | 'release.isrc_assigned'
    | 'release.delivered'
    | 'release.youtube_linked'
    | 'release.rejected'
    | 'release.taken_down'
    | 'release.updated'
    | 'channel.approved'
    | 'channel.rejected'
    | 'webhook.test';
  environment: 'live' | 'test';
  sentAt: string;
  data: T;
  type?: string;
  timestamp?: number;
}
