"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Release,
  ReleaseStatus,
  ReleaseValidationResult,
  Track,
} from "@/types/catalog";
import {
  wlGetReleaseAction,
  wlSubmitReleaseAction,
  wlGetAudioStreamUrlAction,
  validateReleaseAction,
  patchReleaseCorrectionAction,
} from "@/actions/catalog/whitelabel-catalog.action";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Music,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  Calendar,
  FileAudio,
  Radio,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Volume2,
  VolumeX,
  Edit3,
  X,
  Loader2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ReleaseDetailsContent({ code }: { code: string }) {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [qcResult, setQcResult] = useState<ReleaseValidationResult | null>(null);
  const [qcModalOpen, setQcModalOpen] = useState(false);

  // 3000px Cover Art Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Synchronized Lyrics Tab/Drawer State
  const [activeTab, setActiveTab] = useState<"tracks" | "lyrics">("tracks");
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<Track | null>(null);

  // Interactive Waveform & Lossless Player State
  const [activeTrackPlaying, setActiveTrackPlaying] = useState<string | null>(null);
  const [playingTrackTitle, setPlayingTrackTitle] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchRelease = async () => {
    setLoading(true);
    const res = await wlGetReleaseAction(code);
    if (res.success && res.release) {
      setRelease(res.release);
      if (res.release.tracks && res.release.tracks.length > 0) {
        setSelectedTrackForLyrics(res.release.tracks[0]);
      }
    } else {
      toast.error(res.message || "Could not load release");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRelease();
  }, [code]);

  // Pre-flight QC Validation Handler
  const handleValidateQC = async () => {
    setValidating(true);
    try {
      const res = await validateReleaseAction(code);
      if (res.success && res.validation) {
        setQcResult(res.validation);
        setQcModalOpen(true);
        if (res.validation.isValid) {
          toast.success("Quality Control check passed cleanly!");
        } else {
          toast.error(
            `Found ${res.validation.errors.length} fatal error(s) preventing submission.`,
          );
        }
      } else {
        toast.error(res.message || "Validation could not be evaluated.");
      }
    } catch (err: any) {
      toast.error("Validation error: " + err.message);
    } finally {
      setValidating(false);
    }
  };

  // Audio Playback Handler
  const togglePlayTrack = async (trackCode: string) => {
    if (activeTrackPlaying === trackCode) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
        }
      }
      return;
    }

    try {
      const res = await wlGetAudioStreamUrlAction(trackCode);
      if (res.success && res.streamUrl) {
        setAudioUrl(res.streamUrl);
        setActiveTrackPlaying(trackCode);
        const trk = release?.tracks?.find((t) => t.code === trackCode);
        setPlayingTrackTitle(trk?.title || "Audio Preview");
        if (audioRef.current) {
          audioRef.current.src = res.streamUrl;
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      } else {
        toast.error("Audio streaming URL unavailable.");
      }
    } catch (err: any) {
      toast.error("Error playing audio: " + err.message);
    }
  };

  const handlePlaybackRateChange = () => {
    const rates = [1.0, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSubmit = async () => {
    if (qcResult && qcResult.errors.length > 0) {
      toast.error(
        `Cannot submit release: Please resolve ${qcResult.errors.length} fatal QC error(s) first.`,
      );
      setQcModalOpen(true);
      return;
    }

    setSubmitting(true);
    const res = await wlSubmitReleaseAction(code);
    if (res.success) {
      toast.success(res.message);
      fetchRelease();
    } else {
      toast.error(res.message);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: ReleaseStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
            Draft
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Submitted to Mother Company
          </Badge>
        );
      case "IN_REVIEW":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
            In Mother Company Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Approved for Distribution
          </Badge>
        );
      case "DISTRIBUTED":
        return (
          <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
            Live on DSPs
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Action Required (Rejected)</Badge>;
      case "NEEDS_FIX":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Needs Fix (Upstream Review)
          </Badge>
        );
      case "TAKEDOWN":
        return (
          <Badge variant="outline" className="text-zinc-500">
            Takedown
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Release Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested release code does not exist or you do not have permission to view it.
        </p>
        <Link href="/releases">
          <Button>Return to Releases</Button>
        </Link>
      </div>
    );
  }

  const canSubmit =
    release.status === "DRAFT" || release.status === "REJECTED";
  const hasFatalQcErrors = qcResult !== null && qcResult.errors.length > 0;
  const coverImage = release.presignedCoverUrl || release.coverArtUrl;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setActiveTrackPlaying(null);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlaying(false);
          setActiveTrackPlaying(null);
          toast.error("Audio stream unavailable.");
        }}
      />

      {/* Back button & Action buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/releases"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Releases</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Pre-flight Quality Check Action Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleValidateQC}
            disabled={validating || submitting}
            className="flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-semibold"
          >
            {validating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{validating ? "Running QC..." : "Pre-Flight QC Inspector"}</span>
          </Button>

          {canSubmit && (
            <>
              <Link
                href={`/releases/${code}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-accent transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Release</span>
              </Link>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || hasFatalQcErrors}
                className={`flex items-center gap-1.5 shadow-sm font-semibold ${
                  hasFatalQcErrors ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Submitting..." : "Submit to Mother Company"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ANS Upstream Review Audit Trail Box */}
      {(release.status === "REJECTED" ||
        release.upstreamStatus === "NEEDS_FIX" ||
        release.upstreamReason ||
        release.rejectionReason) && (
        <div className="p-5 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 text-amber-500 space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">
                    ANS Upstream Review Audit Trail
                  </h4>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                    Correction Requested
                  </Badge>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Reviewer Feedback:{" "}
                  <strong className="text-foreground">
                    {release.upstreamReason ||
                      release.rejectionReason ||
                      "Metadata or audio assets require correction before DSP submission."}
                  </strong>
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                  <span>Provider: {release.upstreamProvider || "ANS Music / DSP Delivery Hub"}</span>
                  <span>•</span>
                  <span>
                    Timestamp:{" "}
                    {release.updatedAt
                      ? new Date(release.updatedAt).toLocaleString()
                      : "Recent"}
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/releases/${code}/edit`}>
              <Button
                size="sm"
                className="bg-amber-500 text-black hover:bg-amber-400 font-semibold gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>1-Click Edit & Resubmit</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row gap-6 bg-card p-6 rounded-2xl border border-border/70 shadow-xs">
        {/* Cover Art with 3000px Lightbox Trigger */}
        <div
          onClick={() => coverImage && setLightboxOpen(true)}
          className="relative group w-48 h-48 sm:w-56 sm:h-56 shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border/70 shadow-md cursor-pointer"
          title="Click to view 3000px High-Res Cover Art Lightbox"
        >
          {coverImage ? (
            <>
              <img
                src={coverImage}
                alt={release.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1">
                <Maximize2 className="w-6 h-6" />
                <span className="text-[11px] font-semibold">3000px Lightbox</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Music className="w-12 h-12 mb-2" />
              <span className="text-xs">No Artwork</span>
            </div>
          )}
        </div>

        {/* Release Metadata */}
        <div className="flex flex-col justify-between flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(release.status)}
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                {release.type}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {release.code}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {release.title}
            </h1>

            <p className="text-sm font-medium text-muted-foreground">
              {release.contributors && release.contributors.length > 0
                ? release.contributors.map((c) => c.name).join(", ")
                : release.labelName || "Unknown Artist"}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-border/40">
            <div>
              <span className="text-muted-foreground block">Genre</span>
              <span className="font-semibold text-foreground">{release.genre}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Label</span>
              <span className="font-semibold text-foreground">
                {release.labelName || "Independent"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">UPC Barcode</span>
              <span className="font-mono font-medium text-foreground">
                {release.upc || "Auto-Generated"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Target Date</span>
              <span className="font-medium text-foreground">
                {release.releaseDate
                  ? new Date(release.releaseDate).toLocaleDateString()
                  : "Immediate"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Tracklist vs Synchronized Lyrics */}
      <div className="space-y-4 bg-card p-6 rounded-2xl border border-border/70 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("tracks")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tracks"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tracklist & Audio ({release.tracks?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("lyrics")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "lyrics"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Synchronized Lyrics</span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-mono hidden sm:inline-block">
            24-Bit FLAC / Lossless Master Ingestion
          </span>
        </div>

        {activeTab === "tracks" ? (
          /* Tracklist View */
          <div className="divide-y divide-border/40 rounded-xl border border-border/50 overflow-hidden">
            {release.tracks && release.tracks.length > 0 ? (
              release.tracks.map((track) => (
                <div
                  key={track.id}
                  className="p-3.5 flex items-center justify-between gap-4 bg-background/50 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Play Button */}
                    <button
                      onClick={() => togglePlayTrack(track.code)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        activeTrackPlaying === track.code
                          ? "bg-primary text-primary-foreground shadow-md animate-pulse"
                          : "bg-muted hover:bg-primary/20 text-foreground"
                      }`}
                      title={
                        activeTrackPlaying === track.code
                          ? "Pause Preview"
                          : "Play Lossless Audio Preview"
                      }
                    >
                      {activeTrackPlaying === track.code ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {String(track.trackNumber).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {track.title}
                        </span>
                        {track.explicit && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-destructive/10 text-destructive border border-destructive/20 font-mono">
                            EXPLICIT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {track.isrc && (
                          <span className="font-mono">ISRC: {track.isrc}</span>
                        )}
                        {track.fileName && <span>{track.fileName}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <button
                      onClick={() => {
                        setSelectedTrackForLyrics(track);
                        setActiveTab("lyrics");
                      }}
                      className="text-primary hover:underline text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lyrics</span>
                    </button>

                    {track.audioKey ? (
                      <span className="text-emerald-500 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Lossless Ready
                      </span>
                    ) : (
                      <span className="text-destructive font-medium">
                        Missing Audio
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No tracks added to this release.
              </div>
            )}
          </div>
        ) : (
          /* Synchronized Lyrics Drawer / Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Viewing lyrics for:</span>
                <select
                  value={selectedTrackForLyrics?.code || ""}
                  onChange={(e) => {
                    const found = release.tracks?.find(
                      (t) => t.code === e.target.value,
                    );
                    if (found) setSelectedTrackForLyrics(found);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                >
                  {release.tracks?.map((t) => (
                    <option key={t.id} value={t.code}>
                      Track #{t.trackNumber}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTrackForLyrics?.explicit && (
                <Badge variant="destructive" className="text-[10px]">
                  [E] Explicit Content
                </Badge>
              )}
            </div>

            {selectedTrackForLyrics?.lyrics ? (
              <div className="p-6 rounded-xl bg-background border border-border/70 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {selectedTrackForLyrics.lyrics}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border/70 rounded-xl bg-card/40 space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <h4 className="text-sm font-semibold">No lyrics uploaded for this track</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Synchronized (.lrc) or plain text lyrics enhance fan engagement on Apple Music and Spotify.
                </p>
                <Link href={`/releases/${code}/edit`}>
                  <Button size="sm" variant="outline" className="text-xs mt-2">
                    Add Lyrics in Editor
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3000px Cover Art Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{release.title} - High-Resolution Master Artwork</span>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
                  3000 × 3000 px • RGB Color Space
                </Badge>
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Toggle Zoom"
                >
                  {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lossless artwork master inspected for DSP digital delivery standards.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center p-4 bg-black/80 rounded-xl overflow-auto max-h-[70vh]">
            {coverImage && (
              <img
                src={coverImage}
                alt={release.title}
                className={`transition-all duration-200 object-contain rounded-md ${
                  isZoomed ? "scale-150 cursor-zoom-out" : "max-h-[60vh] cursor-zoom-in"
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2-Tier Quality Control (QC) Modal */}
      <Dialog open={qcModalOpen} onOpenChange={setQcModalOpen}>
        <DialogContent className="max-w-2xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Pre-Flight Quality Control (QC) Dossier</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rigorous 2-tier automated DSP validation before submission to Mother Company.
            </DialogDescription>
          </DialogHeader>

          {qcResult && (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Severity 1: Fatal Errors */}
              {qcResult.errors.length > 0 && (
                <div className="p-4 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Severity 1: Fatal Errors ({qcResult.errors.length})
                    </span>
                    <Badge variant="destructive" className="text-[10px] font-mono">
                      BLOCKS SUBMISSION
                    </Badge>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {qcResult.errors.map((err, idx) => (
                      <li
                        key={idx}
                        className="bg-background/80 p-2.5 rounded-lg border border-destructive/30 flex items-start gap-2 text-foreground"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-destructive">{err.message}</p>
                          {err.trackTitle && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              Track: {err.trackTitle}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Severity 2: Advisory Warnings */}
              {qcResult.warnings.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Severity 2: Advisory Warnings ({qcResult.warnings.length})
                    </span>
                    <span className="text-[10px] font-mono text-amber-500 uppercase">
                      Advisory
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-foreground/90">
                    {qcResult.warnings.map((warn, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{warn.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clean QC Pass */}
              {qcResult.passed && qcResult.errors.length === 0 && (
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">QC Inspection Passed Cleanly</h4>
                    <p className="text-xs opacity-90">
                      All metadata, audio bitrates, and 3000x3000px artwork pass Spotify, Apple, and ANS delivery rules.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sticky Bottom Audio Player with Waveform & Lossless Telemetry */}
      {activeTrackPlaying && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-50 p-4 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  if (audioRef.current) {
                    if (audioRef.current.paused) {
                      audioRef.current.play().catch(() => {});
                    } else {
                      audioRef.current.pause();
                    }
                  }
                }}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-foreground truncate">
                    {playingTrackTitle}
                  </p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                    44.1 kHz / 24-bit Lossless
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {release.title} • Lossless Master Ingestion Preview • Bitrate: 1411 kbps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Playback speed toggle */}
              <button
                onClick={handlePlaybackRateChange}
                className="px-2 py-0.5 rounded text-xs font-mono border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Playback Rate"
              >
                {playbackRate}x
              </button>

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (audioRef.current) {
                      audioRef.current.volume = val;
                      audioRef.current.muted = false;
                      setIsMuted(false);
                    }
                  }}
                  className="w-20 h-1.5 accent-primary cursor-pointer"
                />
              </div>

              {/* Close */}
              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                  }
                  setIsPlaying(false);
                  setActiveTrackPlaying(null);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                title="Close Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Multi-Bar Frequency Waveform Visualizer */}
          <div className="space-y-1">
            <div
              className="h-10 w-full flex items-center justify-between gap-[3px] py-1 px-2 rounded-xl bg-muted/30 border border-border/40 cursor-pointer group relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                if (audioRef.current && duration > 0) {
                  audioRef.current.currentTime = ratio * duration;
                  setCurrentTime(ratio * duration);
                }
              }}
              title="Click anywhere along the waveform to scrub seek"
            >
              {Array.from({ length: 44 }).map((_, i) => {
                const barRatio = i / 44;
                const currentRatio = duration > 0 ? currentTime / duration : 0;
                const isPlayed = barRatio <= currentRatio;
                const baseHeight = 25 + Math.sin(i * 0.45) * 35 + ((i * 7) % 35);
                const activeScale = isPlaying
                  ? 0.7 + ((i * 3 + Math.floor(currentTime * 4)) % 5) * 0.15
                  : 0.65;
                const heightPercent = Math.min(
                  95,
                  Math.max(18, baseHeight * activeScale),
                );

                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-150"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: isPlayed
                        ? "var(--primary, #6366f1)"
                        : "currentColor",
                      opacity: isPlayed ? 1 : 0.25,
                    }}
                  />
                );
              })}
            </div>

            {/* Timestamps & Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-sans">
                {isPlaying ? "Playing Lossless Stream" : "Paused"}
              </span>
              <span>
                {duration > 0
                  ? `-${formatTime(Math.max(0, duration - currentTime))}`
                  : formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
