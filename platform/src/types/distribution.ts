export type ReleaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'NEEDS_FIX'
  | 'DISTRIBUTED'
  | 'REJECTED'
  | 'TAKEDOWN';

export type ReleaseType = 'SINGLE' | 'EP' | 'ALBUM' | 'MUSIC_VIDEO';

export type UpstreamProvider = 'DIRECT_DDEX' | 'ANS_MUSIC' | 'REVELATOR' | 'OTHER';
export type UpstreamStatus =
  | 'NOT_SUBMITTED'
  | 'QUEUED'
  | 'DISPATCHED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'NEEDS_FIX'
  | 'DELIVERED'
  | 'LIVE'
  | 'TAKEN_DOWN'
  | 'FAILED';
export type VideoVersion = 'OFFICIAL' | 'LYRIC_VIDEO' | 'VISUALIZER' | 'LIVE' | 'TEASER';
export type VevoChannelStatus = 'PENDING' | 'REQUESTED' | 'APPROVED' | 'REJECTED';

export interface VevoChannel {
  id: string;
  code: string;
  artistName: string;
  channelName: string;
  vevoChannelName: string;
  description?: string;
  status: VevoChannelStatus;
  upstreamChannelId?: string;
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  rejectionReason?: string;
  whiteLabelId: string;
  whiteLabelUserId?: string;
  whiteLabel?: {
    id: string;
    code: string;
    name: string;
    subdomain?: string;
  };
  whiteLabelUser?: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type ContributorRole =
  | 'PRIMARY_ARTIST'
  | 'FEATURED_ARTIST'
  | 'PRODUCER'
  | 'COMPOSER'
  | 'LYRICIST'
  | 'ARRANGER';

export interface Contributor {
  id?: string;
  name: string;
  role: ContributorRole;
  spotifyId?: string;
  appleMusicId?: string;
}

export type AudioScanStatus = 'PENDING' | 'CLEAN' | 'MATCH_FOUND' | 'FAILED';

export interface TrackAudioScan {
  id: string;
  status: AudioScanStatus;
  matchScore?: number | null;
  matchedTitle?: string | null;
  matchedArtist?: string | null;
  matchedAlbum?: string | null;
  matchedIsrc?: string | null;
  matchedLabel?: string | null;
  externalIds?: Record<string, unknown> | null;
  errorMessage?: string | null;
  scannedAt: string;
}

export interface Track {
  id: string;
  code: string;
  trackNumber: number;
  discNumber: number;
  title: string;
  version?: string;
  isrc?: string;
  iswc?: string;
  durationSeconds?: number;
  explicit: boolean;
  audioKey?: string;
  audioUrl?: string;
  audioDownloadUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  lyrics?: string;
  language: string;
  contributors?: Contributor[];
  audioScan?: TrackAudioScan;
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  code: string;
  title: string;
  type: ReleaseType;
  upc?: string;
  catalogNumber?: string;
  releaseDate?: string;
  originalReleaseDate?: string;
  genre: string;
  subgenre?: string;
  labelName?: string;
  cLine?: string;
  pLine?: string;
  coverArtKey?: string;
  coverArtUrl?: string;
  coverArtDownloadUrl?: string;
  presignedCoverUrl?: string;
  status: ReleaseStatus;
  rejectionReason?: string;
  adminNotes?: string;
  submittedAt?: string;
  distributedAt?: string;
  whiteLabelId: string;
  whiteLabelUserId?: string;
  whiteLabel?: {
    id: string;
    code: string;
    name: string;
    subdomain?: string;
    customDomain?: string;
    logoUrl?: string;
    supportEmail?: string;
  };
  whiteLabelUser?: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tracks?: Track[];
  contributors?: Contributor[];
  trackCount?: number;
  upstreamProvider?: UpstreamProvider;
  upstreamReleaseId?: string;
  upstreamVideoId?: string;
  upstreamStatus?: UpstreamStatus;
  upstreamReason?: string;
  youtubeVideoId?: string;
  youtubeWatchUrl?: string;
  isrcAssignedByUpstream?: boolean;
  upcAssignedByUpstream?: boolean;
  videoVersion?: VideoVersion;
  videoUrl?: string;
  vevoChannelName?: string;
  createdAt: string;
  updatedAt: string;
}
