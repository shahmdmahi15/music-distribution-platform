"use server";

import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import {
  Release,
  ReleaseStatus,
  Track,
  ReleaseValidationResult,
  ValidationErrorItem,
  ValidationWarningItem,
} from "@/types/catalog";
import axios from "axios";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WL_SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function wlGetUploadUrlAction(data: {
  type: "AUDIO" | "COVER_ART";
  fileName: string;
  mimeType: string;
}): Promise<{
  success: boolean;
  message: string;
  uploadUrl?: string;
  key?: string;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post("/whitelabel/catalog/upload-url", data, {
      headers,
    });
    return {
      success: true,
      message: "Upload URL generated.",
      uploadUrl: res.data.uploadUrl,
      key: res.data.key,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlCreateReleaseAction(data: any): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post("/whitelabel/catalog/releases", data, {
      headers,
    });
    return {
      success: true,
      message: "Release draft created successfully.",
      release: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlGetReleasesAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReleaseStatus;
}): Promise<{
  success: boolean;
  message: string;
  data: Release[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get("/whitelabel/catalog/releases", {
      headers,
      params,
    });
    return {
      success: true,
      message: "Releases retrieved successfully.",
      data: res.data.data || [],
      meta: res.data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    }
    return {
      success: false,
      message: (error as Error).message,
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }
}

export async function wlGetReleaseAction(code: string): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get(`/whitelabel/catalog/releases/${code}`, {
      headers,
    });
    return {
      success: true,
      message: "Release retrieved successfully.",
      release: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlUpdateReleaseAction(
  code: string,
  data: any,
): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.put(`/whitelabel/catalog/releases/${code}`, data, {
      headers,
    });
    return {
      success: true,
      message: "Release updated successfully.",
      release: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlSubmitReleaseAction(code: string): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post(
      `/whitelabel/catalog/releases/${code}/submit`,
      {},
      { headers },
    );
    return {
      success: true,
      message: res.data.message || "Release submitted successfully.",
      release: res.data.release,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlAddTrackAction(
  releaseCode: string,
  data: any,
): Promise<{
  success: boolean;
  message: string;
  track?: Track;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post(
      `/whitelabel/catalog/releases/${releaseCode}/tracks`,
      data,
      { headers },
    );
    return {
      success: true,
      message: "Track added successfully.",
      track: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlDeleteTrackAction(
  releaseCode: string,
  trackCode: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.delete(
      `/whitelabel/catalog/releases/${releaseCode}/tracks/${trackCode}`,
      { headers },
    );
    return {
      success: true,
      message: res.data.message || "Track removed.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlGetAudioStreamUrlAction(trackCode: string): Promise<{
  success: boolean;
  message: string;
  streamUrl?: string;
  title?: string;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get(
      `/whitelabel/catalog/tracks/${trackCode}/stream`,
      { headers },
    );
    return {
      success: true,
      message: "Stream URL generated.",
      streamUrl: res.data.streamUrl,
      title: res.data.title,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

// ==========================================================
// Revelator-Parity 2-Tier Quality Control (QC) Validation Action
// ==========================================================

export async function wlValidateReleaseAction(code: string): Promise<{
  success: boolean;
  message: string;
  validation?: ReleaseValidationResult;
}> {
  try {
    const headers = await getAuthHeader();
    try {
      const res = await api.post(
        `/whitelabel/catalog/releases/${code}/validate`,
        {},
        { headers },
      );
      if (res.data && (res.data.errors !== undefined || res.data.validation !== undefined)) {
        return {
          success: true,
          message: res.data.message || "Quality check completed.",
          validation: res.data.validation || res.data,
        };
      }
    } catch (endpointError: any) {
      // If endpoint returns non-200 or 404, fallback to robust in-action QC evaluation
    }

    // Comprehensive 2-Tier QC Fallback Evaluation Engine
    const releaseRes = await wlGetReleaseAction(code);
    if (!releaseRes.success || !releaseRes.release) {
      return {
        success: false,
        message: releaseRes.message || "Could not retrieve release for validation.",
      };
    }

    const release = releaseRes.release;
    const errors: ValidationErrorItem[] = [];
    const warnings: ValidationWarningItem[] = [];

    // --- SEVERITY 1: FATAL ERRORS (BLOCKS DSP SUBMISSION) ---

    // 1. Missing Artwork
    if (!release.coverArtKey && !release.coverArtUrl && !release.presignedCoverUrl) {
      errors.push({
        code: "ERR_ARTWORK_MISSING",
        message: "Missing Cover Artwork: 3000x3000px square cover art (RGB JPEG/PNG) is strictly required by Spotify, Apple, and DSP ingestion feeds.",
        field: "coverArtKey",
        severity: 1,
      });
    }

    // 2. Missing Tracks
    if (!release.tracks || release.tracks.length === 0) {
      errors.push({
        code: "ERR_NO_TRACKS",
        message: "Empty Tracklist: Release must contain at least 1 audio track before distribution.",
        field: "tracks",
        severity: 1,
      });
    }

    // 3. Track-level Fatal Errors
    if (release.tracks && release.tracks.length > 0) {
      release.tracks.forEach((track, index) => {
        // Missing Audio
        if (!track.audioKey && !track.audioUrl) {
          errors.push({
            code: "ERR_AUDIO_MISSING",
            message: `Missing Lossless Audio: Track #${track.trackNumber || index + 1} ("${track.title}") has no audio file uploaded.`,
            trackCode: track.code,
            trackTitle: track.title,
            field: "audioKey",
            severity: 1,
          });
        }

        // Invalid ISRC Format Check (Standard ISO 3901: 2 Letters Country, 3 Alphanumeric Registrant, 2 Digits Year, 5 Digits Designation)
        if (track.isrc) {
          const cleanIsrc = track.isrc.replace(/-/g, "").trim();
          const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/i;
          if (!isrcRegex.test(cleanIsrc)) {
            errors.push({
              code: "ERR_ISRC_INVALID",
              message: `Invalid ISRC Format: Track #${track.trackNumber} ("${track.title}") has malformed ISRC "${track.isrc}". Expected format: CC-XXX-YY-NNNNN.`,
              trackCode: track.code,
              trackTitle: track.title,
              field: "isrc",
              severity: 1,
            });
          }
        }

        // ACRCloud Copyright Flag
        if (track.audioScan?.status === "MATCH_FOUND") {
          errors.push({
            code: "ERR_COPYRIGHT_MATCH",
            message: `ACRCloud Copyright Flag: Track #${track.trackNumber} ("${track.title}") matched existing master "${track.audioScan.matchedTitle || "Protected Sound"}" by ${track.audioScan.matchedArtist || "Unknown Artist"} (${track.audioScan.matchScore || 100}% confidence). Flagged audio cannot be distributed.`,
            trackCode: track.code,
            trackTitle: track.title,
            field: "audioScan",
            severity: 1,
          });
        }
      });
    }

    // 4. Missing Basic Metadata
    if (!release.title || !release.title.trim()) {
      errors.push({
        code: "ERR_TITLE_REQUIRED",
        message: "Missing Release Title: Album or single title cannot be empty.",
        field: "title",
        severity: 1,
      });
    }

    if (!release.genre || !release.genre.trim()) {
      errors.push({
        code: "ERR_GENRE_REQUIRED",
        message: "Missing Genre: Primary musical genre is required for DSP algorithmic placement.",
        field: "genre",
        severity: 1,
      });
    }

    // --- SEVERITY 2: WARNINGS (ADVISORY & SUGGESTIONS) ---

    // 1. Short Track Duration (<60s)
    if (release.tracks) {
      release.tracks.forEach((track) => {
        if (track.durationSeconds && track.durationSeconds < 60) {
          warnings.push({
            code: "WARN_SHORT_DURATION",
            message: `Short Track Duration: Track #${track.trackNumber} ("${track.title}") duration is under 60 seconds (${track.durationSeconds}s). Some DSPs may classify this as ringtone or intro snippet.`,
            trackCode: track.code,
            trackTitle: track.title,
            severity: 2,
          });
        }

        // Track Title Casing Suggestion
        if (track.title && track.title.length > 3) {
          if (track.title === track.title.toUpperCase()) {
            warnings.push({
              code: "WARN_TITLE_CASING",
              message: `Title Casing Suggestion: Track #${track.trackNumber} ("${track.title}") is in ALL CAPS. Apple and Spotify style guides recommend standard Title Casing.`,
              trackCode: track.code,
              trackTitle: track.title,
              severity: 2,
            });
          } else if (track.title === track.title.toLowerCase()) {
            warnings.push({
              code: "WARN_TITLE_CASING_LOWER",
              message: `Title Casing Suggestion: Track #${track.trackNumber} ("${track.title}") is in all lowercase. Consider capitalizing principal words.`,
              trackCode: track.code,
              trackTitle: track.title,
              severity: 2,
            });
          }
        }
      });
    }

    // 2. Release Title Casing
    if (release.title && release.title.length > 3) {
      if (release.title === release.title.toUpperCase()) {
        warnings.push({
          code: "WARN_RELEASE_TITLE_CASING",
          message: `Title Casing Suggestion: Release title "${release.title}" is in ALL CAPS. DSP style guides prefer standard Title Casing.`,
          field: "title",
          severity: 2,
        });
      }
    }

    // 3. Missing Barcode (UPC / EAN)
    if (!release.upc || !release.upc.trim()) {
      warnings.push({
        code: "WARN_UPC_MISSING",
        message: "UPC / EAN Empty: A standardized barcode will be automatically generated and assigned upon DSP distribution.",
        field: "upc",
        severity: 2,
      });
    }

    // 4. Missing Record Label
    if (!release.labelName || !release.labelName.trim()) {
      warnings.push({
        code: "WARN_LABEL_EMPTY",
        message: "Record Label Empty: The default WhiteLabel tenant name will be credited as the record label imprint.",
        field: "labelName",
        severity: 2,
      });
    }

    // 5. Missing C-Line or P-Line
    if (!release.cLine || !release.pLine) {
      warnings.push({
        code: "WARN_COPYRIGHT_LINES",
        message: "Copyright (C-Line) or Publishing (P-Line) line not specified. Standard year and distributor copyright notices will apply.",
        severity: 2,
      });
    }

    const validation: ReleaseValidationResult = {
      isValid: errors.length === 0,
      canSubmit: errors.length === 0,
      errors,
      warnings,
      summary: {
        fatalCount: errors.length,
        warningCount: warnings.length,
        passed: errors.length === 0,
        inspectedAt: new Date().toISOString(),
      },
    };

    return {
      success: true,
      message: errors.length === 0 ? "Quality control inspection passed." : "Quality control found fatal errors.",
      validation,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

// User-prompt alias
export async function validateReleaseAction(code: string) {
  return wlValidateReleaseAction(code);
}
