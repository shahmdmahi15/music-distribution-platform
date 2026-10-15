export type ReleaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'DISTRIBUTED'
  | 'REJECTED'
  | 'TAKEDOWN'
  | 'NEEDS_FIX';

export type ReleaseType = 'SINGLE' | 'EP' | 'ALBUM' | 'MUSIC_VIDEO';

export type VideoVersion =
  | 'OFFICIAL'
  | 'LYRIC'
  | 'AUDIO'
  | 'LIVE'
  | 'INTERVIEW'
  | 'BEHIND_THE_SCENES'
  | 'TEASER'
  | 'ORIGINAL';

export interface VevoChannel {
  id: string;
  code: string;
  channelName: string;
  artistName?: string;
  description?: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  channelUrl?: string;
  youtubeChannelId?: string;
  createdAt: string;
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
  presignedCoverUrl?: string;
  status: ReleaseStatus;
  rejectionReason?: string;
  adminNotes?: string;
  submittedAt?: string;
  distributedAt?: string;
  releaseType?: ReleaseType;
  upstreamProvider?: string;
  upstreamReleaseId?: string;
  upstreamVideoId?: string;
  upstreamStatus?: 'PENDING' | 'NEEDS_FIX' | 'APPROVED' | 'DELIVERED' | 'REJECTED' | 'TAKEN_DOWN';
  upstreamReason?: string;
  youtubeVideoId?: string;
  youtubeWatchUrl?: string;
  isrcAssignedByUpstream?: boolean;
  upcAssignedByUpstream?: boolean;
  videoVersion?: VideoVersion;
  videoUrl?: string;
  vevoChannelName?: string;
  tracks?: Track[];
  contributors?: Contributor[];
  trackCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2-Tier Quality Control (QC) Validation Types
// ==========================================

export interface ValidationErrorItem {
  code: string;
  message: string;
  field?: string;
  trackCode?: string;
  trackTitle?: string;
  severity: 1; // Fatal Error - blocks DSP submission
}

export interface ValidationWarningItem {
  code: string;
  message: string;
  field?: string;
  trackCode?: string;
  trackTitle?: string;
  severity: 2; // Warning - non-blocking recommendation
}

export interface ReleaseValidationResult {
  isValid: boolean;
  canSubmit: boolean;
  passed?: boolean;
  errors: ValidationErrorItem[];
  warnings: ValidationWarningItem[];
  summary: {
    fatalCount: number;
    warningCount: number;
    passed: boolean;
    inspectedAt: string;
  };
}
