"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Release, ReleaseStatus } from "@/types/catalog";
import {
  wlGetReleaseAction,
  wlSubmitReleaseAction,
  wlGetAudioStreamUrlAction,
} from "@/actions/catalog/whitelabel-catalog.action";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Music,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Send,
  Calendar,
  FileAudio,
  Radio,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Volume2,
  VolumeX,
  Edit3,
  X,
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
  const [activeTrackPlaying, setActiveTrackPlaying] = useState<string | null>(
    null,
  );
  const [playingTrackTitle, setPlayingTrackTitle] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchRelease = async () => {
    setLoading(true);
    const res = await wlGetReleaseAction(code);
    if (res.success && res.release) {
      setRelease(res.release);
    } else {
      toast.error(res.message || "Could not load release");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRelease();
  }, [code]);

  // Audio Playback Handler
  const togglePlayTrack = async (trackCode: string) => {
    if (activeTrackPlaying === trackCode) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play();
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
          audioRef.current.play();
        }
      } else {
        toast.error("Audio streaming URL unavailable.");
      }
    } catch (err: any) {
      toast.error("Error playing audio: " + err.message);
    }
  };

  const handleSubmit = async () => {
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
        return <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Draft</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Submitted to Mother Company</Badge>;
      case "IN_REVIEW":
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">In Mother Company Review</Badge>;
      case "APPROVED":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved for Distribution</Badge>;
      case "DISTRIBUTED":
        return <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">Live on DSPs</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Action Required (Rejected)</Badge>;
      case "TAKEDOWN":
        return <Badge variant="outline" className="text-zinc-500">Takedown</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderAudioScanBadge = (track: any) => {
    const scan = track.audioScan;
    if (!scan) return null;

    if (scan.status === "CLEAN") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          ACRCloud Verified Clean
        </span>
      );
    }

    if (scan.status === "MATCH_FOUND") {
      return (
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 w-fit">
            <AlertCircle className="w-3 h-3" />
            Copyright Match Found ({scan.matchScore || 100}%)
          </span>
          <span className="text-[10px] text-rose-400 font-mono pl-1">
            Matched: "{scan.matchedTitle}" by {scan.matchedArtist || "Unknown"}
          </span>
        </div>
      );
    }

    if (scan.status === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-3 h-3 animate-spin" />
          Scanning Fingerprint...
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3" />
        Scan Review Required
      </span>
    );
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
        <Button render={<Link href="/releases">Return to Releases</Link>} />
      </div>
    );
  }

  const canSubmit =
    release.status === "DRAFT" || release.status === "REJECTED";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
        onEnded={() => {
          setActiveTrackPlaying(null);
          setCurrentTime(0);
        }}
        onError={() => {
          setActiveTrackPlaying(null);
          toast.error("Audio format could not be played in browser.");
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

        {canSubmit && (
          <div className="flex items-center gap-2">
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
              disabled={submitting}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Submitting..." : "Submit to Mother Company"}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Rejection / Note Alert */}
      {release.status === "REJECTED" && (
        <div className="p-4 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Release Rejected by Mother Company Staff</h4>
            <p className="text-xs">
              Reason: {release.rejectionReason || "Please fix metadata or re-upload high quality audio files."}
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row gap-6 bg-card p-6 rounded-2xl border border-border/60 shadow-xs">
        {/* Cover Art */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border/70 shadow-md">
          {release.presignedCoverUrl || release.coverArtUrl ? (
            <img
              src={release.presignedCoverUrl || release.coverArtUrl}
              alt={release.title}
              className="w-full h-full object-cover"
            />
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
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {release.type}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {release.code}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
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
              <span className="font-medium text-foreground">{release.genre}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Label</span>
              <span className="font-medium text-foreground">{release.labelName || "Independent"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">UPC</span>
              <span className="font-medium text-foreground">{release.upc || "Pending"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Release Date</span>
              <span className="font-medium text-foreground">
                {release.releaseDate
                  ? new Date(release.releaseDate).toLocaleDateString()
                  : "Immediate"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist & Audio Player Section */}
      <div className="space-y-4 bg-card p-6 rounded-2xl border border-border/60 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>Tracklist ({release.tracks?.length || 0})</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            Lossless Lossless Audio (FLAC/WAV)
          </span>
        </div>

        <div className="divide-y divide-border/40 rounded-xl border border-border/50 overflow-hidden">
          {release.tracks && release.tracks.length > 0 ? (
            release.tracks.map((track, idx) => (
              <div
                key={track.id}
                className="p-3.5 flex items-center justify-between gap-4 bg-background/50 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Play Button */}
                  <button
                    onClick={() => togglePlayTrack(track.code)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
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
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5" />
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
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-destructive/10 text-destructive border border-destructive/20">
                          EXPLICIT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {track.isrc && <span>ISRC: {track.isrc}</span>}
                      {track.fileName && <span>{track.fileName}</span>}
                    </div>
                    {renderAudioScanBadge(track)}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {track.audioKey ? (
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Audio Lossless Ready
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
      </div>

      {/* Sticky Bottom Audio Player */}
      {activeTrackPlaying && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-50 p-4 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  if (audioRef.current) {
                    if (audioRef.current.paused) {
                      audioRef.current.play();
                    } else {
                      audioRef.current.pause();
                    }
                  }
                }}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md hover:opacity-90 transition-opacity"
              >
                {audioRef.current?.paused ? (
                  <Play className="w-4 h-4 ml-0.5" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {playingTrackTitle}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {release.title} • Lossless Preview
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
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
                  setActiveTrackPlaying(null);
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Close Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrubber & Timestamps */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (audioRef.current) {
                  audioRef.current.currentTime = val;
                }
              }}
              className="flex-1 h-1.5 accent-primary cursor-pointer rounded-lg bg-accent"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
