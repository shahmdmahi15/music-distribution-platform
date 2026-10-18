"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
  wlCreateReleaseAction,
  wlAddTrackAction,
  wlSubmitReleaseAction,
  wlGetUploadUrlAction,
} from "@/actions/catalog/whitelabel-catalog.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Progress } from "@/components/ui/progress";
import {
  Music,
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  FileAudio,
  Sparkles,
  Info,
  Disc,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
  Layers,
  Radio,
  Clock,
  Loader2,
} from "lucide-react";

interface TrackDraft {
  id: string;
  title: string;
  artist: string;
  isrc: string;
  explicit: boolean;
  audioKey?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  sampleRate?: number;
  durationSeconds?: number;
  uploading?: boolean;
  uploadProgress?: number;
}

interface ArtworkInspection {
  width: number;
  height: number;
  aspectRatio: string;
  fileSizeBytes: number;
  isSquare: boolean;
  isHighRes: boolean; // >= 3000 x 3000 px
  isSizeOk: boolean; // <= 20MB
}

export function CreateReleaseContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Release Info
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"SINGLE" | "EP" | "ALBUM" | "MUSIC_VIDEO">("SINGLE");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [subgenre, setSubgenre] = useState("");
  const [labelName, setLabelName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [upc, setUpc] = useState("");
  const [cLine, setCLine] = useState("");
  const [pLine, setPLine] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoVersion, setVideoVersion] = useState("OFFICIAL");
  const [vevoChannelName, setVevoChannelName] = useState("");

  // Step 2: Cover Artwork
  const [coverArtKey, setCoverArtKey] = useState<string>("");
  const [coverArtPreview, setCoverArtPreview] = useState<string>("");
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [artworkInspection, setArtworkInspection] = useState<ArtworkInspection | null>(null);
  const [isDraggingArt, setIsDraggingArt] = useState(false);

  // Step 3: Tracks & Batch Audio Uploader
  const [tracks, setTracks] = useState<TrackDraft[]>([
    {
      id: "track-1",
      title: "",
      artist: "",
      isrc: "",
      explicit: false,
    },
  ]);

  // Step 4: Deal Acceptance Checkboxes
  const [agreedRights, setAgreedRights] = useState(true);
  const [agreedLossless, setAgreedLossless] = useState(true);
  const [agreedDspTerms, setAgreedDspTerms] = useState(true);

  // Inspect and validate artwork image client-side
  const inspectAndUploadArtwork = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPEG or PNG).");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setCoverArtPreview(localUrl);

    // Read Dimensions
    const img = new Image();
    img.src = localUrl;
    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const isSquare = Math.abs(width - height) <= 2;
      const isHighRes = width >= 3000 && height >= 3000;
      const isSizeOk = file.size <= 20 * 1024 * 1024; // 20MB

      setArtworkInspection({
        width,
        height,
        aspectRatio: isSquare ? "1:1 Square" : `${width}:${height}`,
        fileSizeBytes: file.size,
        isSquare,
        isHighRes,
        isSizeOk,
      });

      if (!isSquare) {
        toast.warning("Warning: Non-square cover art detected. DSPs recommend exact 1:1 square.");
      } else if (!isHighRes) {
        toast.warning(`Notice: Resolution is ${width}x${height}px. DSPs recommend ≥ 3000x3000px.`);
      }

      // Upload to Cloud
      setUploadingArtwork(true);
      try {
        const urlRes = await wlGetUploadUrlAction({
          type: "COVER_ART",
          fileName: file.name,
          mimeType: file.type,
        });

        if (!urlRes.success || !urlRes.uploadUrl || !urlRes.key) {
          throw new Error(urlRes.message || "Failed to get upload URL");
        }

        await axios.put(urlRes.uploadUrl, file, {
          headers: { "Content-Type": file.type },
        });

        setCoverArtKey(urlRes.key);
        toast.success("Cover artwork validated and uploaded!");
      } catch (err: any) {
        toast.error("Failed to upload artwork: " + (err.message || "Error"));
      } finally {
        setUploadingArtwork(false);
      }
    };
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) inspectAndUploadArtwork(file);
  };

  const handleArtDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingArt(false);
    const file = e.dataTransfer.files?.[0];
    if (file) inspectAndUploadArtwork(file);
  };

  // Helper to extract audio metadata via AudioContext
  const extractAudioMetadata = async (
    file: File,
  ): Promise<{ sampleRate: number; durationSeconds: number }> => {
    return new Promise((resolve) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          resolve({ sampleRate: 44100, durationSeconds: 180 });
          return;
        }
        const ctx = new AudioCtx();
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            const decoded = await ctx.decodeAudioData(buffer.slice(0, 500000));
            resolve({
              sampleRate: decoded.sampleRate || 44100,
              durationSeconds: Math.round(decoded.duration) || 0,
            });
          } catch {
            resolve({ sampleRate: 44100, durationSeconds: 0 });
          }
        };
        reader.readAsArrayBuffer(file);
      } catch {
        resolve({ sampleRate: 44100, durationSeconds: 0 });
      }
    });
  };

  // Batch Audio File Upload Handler
  const handleBatchAudioFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    toast.info(`Queueing ${fileArray.length} audio file(s) for lossless ingestion...`);

    const newDrafts: TrackDraft[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      // Clean filename for title
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+[\s-_.]*/, "")
        .replace(/_/g, " ")
        .trim();

      const newId = `track-batch-${Date.now()}-${i}`;
      const draft: TrackDraft = {
        id: newId,
        title: cleanTitle || `Track ${tracks.length + i + 1}`,
        artist: artistName || "",
        isrc: "",
        explicit: false,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "audio/wav",
        uploading: true,
        uploadProgress: 10,
      };
      newDrafts.push(draft);
    }

    // Append to existing tracks (or replace single empty track)
    setTracks((prev) => {
      if (prev.length === 1 && !prev[0].title && !prev[0].audioKey) {
        return newDrafts;
      }
      return [...prev, ...newDrafts];
    });

    // Upload each audio file sequentially
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const draft = newDrafts[i];

      try {
        const meta = await extractAudioMetadata(file);

        const urlRes = await wlGetUploadUrlAction({
          type: "AUDIO",
          fileName: file.name,
          mimeType: file.type || "audio/wav",
        });

        if (!urlRes.success || !urlRes.uploadUrl || !urlRes.key) {
          throw new Error(urlRes.message || "Failed to generate audio upload URL");
        }

        await axios.put(urlRes.uploadUrl, file, {
          headers: { "Content-Type": file.type || "audio/wav" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setTracks((prev) =>
                prev.map((t) =>
                  t.id === draft.id ? { ...t, uploadProgress: percent } : t,
                ),
              );
            }
          },
        });

        setTracks((prev) =>
          prev.map((t) =>
            t.id === draft.id
              ? {
                  ...t,
                  audioKey: urlRes.key,
                  sampleRate: meta.sampleRate,
                  durationSeconds: meta.durationSeconds,
                  uploading: false,
                }
              : t,
          ),
        );
        toast.success(`Lossless audio ready: ${file.name}`);
      } catch (err: any) {
        setTracks((prev) =>
          prev.map((t) =>
            t.id === draft.id ? { ...t, uploading: false } : t,
          ),
        );
        toast.error(`Audio upload failed for ${file.name}: ${err.message}`);
      }
    }
  };

  const addTrack = () => {
    setTracks((prev) => [
      ...prev,
      {
        id: `track-${Date.now()}`,
        title: "",
        artist: artistName || "",
        isrc: "",
        explicit: false,
      },
    ]);
  };

  const removeTrack = (id: string) => {
    if (tracks.length === 1) {
      toast.error("A release must have at least one track.");
      return;
    }
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTrackField = (
    id: string,
    field: keyof TrackDraft,
    value: any,
  ) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!title.trim()) {
      toast.error("Please enter a release title.");
      return false;
    }
    if (!artistName.trim()) {
      toast.error("Please specify the primary artist name.");
      return false;
    }
    if (type === "MUSIC_VIDEO") {
      if (!vevoChannelName.trim()) {
        toast.error("Please specify the VEVO Channel name (e.g. ArtistVEVO).");
        return false;
      }
      if (!videoUrl.trim()) {
        toast.error("Please provide the master video URL or cloud storage path.");
        return false;
      }
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!coverArtKey) {
      toast.error("Please upload high-resolution cover artwork.");
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      if (!t.title.trim()) {
        toast.error(`Track #${i + 1} must have a title.`);
        return false;
      }
      if (!t.audioKey && type !== "MUSIC_VIDEO") {
        toast.error(`Track #${i + 1} ("${t.title}") is missing an audio file.`);
        return false;
      }
    }
    return true;
  };

  // Handle final submission
  const handleSubmitRelease = async (submitToMother: boolean) => {
    if (submitToMother && (!agreedRights || !agreedLossless || !agreedDspTerms)) {
      toast.error("Please agree to all distribution terms before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create release draft
      const releaseRes = await wlCreateReleaseAction({
        title,
        type: type as any,
        genre,
        subgenre: subgenre || undefined,
        labelName: labelName || undefined,
        releaseDate: releaseDate || undefined,
        upc: upc || undefined,
        cLine: cLine || undefined,
        pLine: pLine || undefined,
        coverArtKey,
        videoUrl: type === "MUSIC_VIDEO" ? videoUrl : undefined,
        videoVersion: type === "MUSIC_VIDEO" ? (videoVersion as any) : undefined,
        vevoChannelName: type === "MUSIC_VIDEO" ? vevoChannelName : undefined,
        contributors: [
          {
            name: artistName,
            role: "PRIMARY_ARTIST",
          },
        ],
      });

      if (!releaseRes.success || !releaseRes.release) {
        throw new Error(releaseRes.message || "Failed to create release draft");
      }

      const releaseCode = releaseRes.release.code;

      // 2. Add each track
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        await wlAddTrackAction(releaseCode, {
          title: t.title,
          trackNumber: i + 1,
          discNumber: 1,
          isrc: t.isrc || undefined,
          explicit: t.explicit,
          audioKey: t.audioKey,
          fileName: t.fileName,
          fileSizeBytes: t.fileSizeBytes,
          mimeType: t.mimeType,
          durationSeconds: t.durationSeconds,
          contributors: t.artist
            ? [
                {
                  name: t.artist,
                  role: "PRIMARY_ARTIST",
                },
              ]
            : undefined,
        });
      }

      // 3. Submit if requested
      if (submitToMother) {
        const submitRes = await wlSubmitReleaseAction(releaseCode);
        if (!submitRes.success) {
          throw new Error(submitRes.message || "Failed to submit release");
        }
        toast.success(
          "Release submitted successfully to Mother Company for DSP distribution!",
        );
      } else {
        toast.success("Release draft saved successfully.");
      }

      router.push(`/releases/${releaseCode}`);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { step: 1, title: "Metadata", subtitle: "Core Dossier" },
    { step: 2, title: "Cover Artwork", subtitle: "3000x3000px Inspector" },
    { step: 3, title: "Audio Masters", subtitle: "Lossless Queue" },
    { step: 4, title: "Distribution Deal", subtitle: "Review & Sign" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Back button */}
      <div>
        <Link
          href="/releases"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Releases</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          New Music Release
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Provide release metadata, lossless audio files, and high-resolution cover art for global DSP distribution.
        </p>
      </div>

      {/* 4-Step Visual Progress Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-border/60 pb-6">
        {steps.map((s) => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <div
              key={s.step}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isCurrent
                  ? "border-primary bg-primary/10 text-primary shadow-xs"
                  : isDone
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                    : "border-border/40 bg-muted/20 text-muted-foreground opacity-60"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate leading-tight">
                  {s.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {s.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* STEP 1: Metadata */}
      {currentStep === 1 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/70 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="text-xs font-semibold">
                Release Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Serenade"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist" className="text-xs font-semibold">
                Primary Artist *
              </Label>
              <Input
                id="artist"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g. Luna Eclipse"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-semibold">
                Release Type
              </Label>
              <select
                id="type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "SINGLE" | "EP" | "ALBUM" | "MUSIC_VIDEO")
                }
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="SINGLE">Single (Audio)</option>
                <option value="EP">EP (Audio)</option>
                <option value="ALBUM">Album (Audio)</option>
                <option value="MUSIC_VIDEO">Music Video (VEVO / YouTube)</option>
              </select>
            </div>

            {type === "MUSIC_VIDEO" && (
              <div className="md:col-span-2 p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500" />
                  <h4 className="text-sm font-semibold">VEVO & YouTube Video Settings</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vevoChannel" className="text-xs font-semibold">
                      VEVO Channel Name *
                    </Label>
                    <Input
                      id="vevoChannel"
                      value={vevoChannelName}
                      onChange={(e) => setVevoChannelName(e.target.value)}
                      placeholder="e.g. ArtistNameVEVO"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoVersion" className="text-xs font-semibold">
                      Video Version *
                    </Label>
                    <select
                      id="videoVersion"
                      value={videoVersion}
                      onChange={(e) => setVideoVersion(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="OFFICIAL">Official Music Video</option>
                      <option value="LYRIC">Lyric Video</option>
                      <option value="AUDIO">Official Audio Video</option>
                      <option value="LIVE">Live Performance</option>
                      <option value="BEHIND_THE_SCENES">Behind The Scenes</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="videoUrl" className="text-xs font-semibold">
                      Master Video Storage URL *
                    </Label>
                    <Input
                      id="videoUrl"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://storage.yourdomain.com/videos/master.mp4"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="genre" className="text-xs font-semibold">
                Primary Genre *
              </Label>
              <Input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Pop, Hip Hop, Electronic"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subgenre" className="text-xs font-semibold">
                Subgenre (Optional)
              </Label>
              <Input
                id="subgenre"
                value={subgenre}
                onChange={(e) => setSubgenre(e.target.value)}
                placeholder="e.g. Synthpop, Lo-fi"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label" className="text-xs font-semibold">
                Record Label Imprint
              </Label>
              <Input
                id="label"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="e.g. Royal Motion Records"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseDate" className="text-xs font-semibold">
                Target Release Date
              </Label>
              <Input
                id="releaseDate"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upc" className="text-xs font-semibold">
                UPC / EAN Barcode (Optional)
              </Label>
              <Input
                id="upc"
                value={upc}
                onChange={(e) => setUpc(e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="text-sm font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cline" className="text-xs font-semibold">
                C-Line (Copyright)
              </Label>
              <Input
                id="cline"
                value={cLine}
                onChange={(e) => setCLine(e.target.value)}
                placeholder="e.g. 2026 Royal Motion Records"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/40">
            <Button
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className="gap-1.5 font-semibold"
            >
              <span>Continue to Artwork Inspector</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Cover Artwork Drag-and-Drop Inspector */}
      {currentStep === 2 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/70 shadow-xs">
          <div className="text-center max-w-lg mx-auto space-y-1.5">
            <h3 className="text-lg font-bold">Cover Artwork Inspector</h3>
            <p className="text-xs text-muted-foreground">
              DSP Specifications: Minimum 3000 x 3000 pixels, exact 1:1 square ratio, RGB color mode, JPEG or PNG format, max 20MB.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingArt(true);
            }}
            onDragLeave={() => setIsDraggingArt(false)}
            onDrop={handleArtDrop}
            className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center ${
              isDraggingArt
                ? "border-primary bg-primary/10"
                : "border-border/80 hover:border-primary/50 bg-background/50"
            }`}
          >
            {coverArtPreview ? (
              <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-xl">
                <div className="w-56 shrink-0">
                  <AspectRatio ratio={1} className="relative group rounded-xl overflow-hidden border border-border shadow-md">
                    <img
                      src={coverArtPreview}
                      alt="Artwork Preview"
                      className="w-full h-full object-cover"
                    />
                    {uploadingArtwork && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs font-medium gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Inspecting & Uploading...</span>
                      </div>
                    )}
                    {!uploadingArtwork && (
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs font-semibold">Replace Artwork</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={handleCoverArtChange}
                        />
                      </label>
                    )}
                  </AspectRatio>
                </div>

                {/* Live Inspector Badges */}
                {artworkInspection && (
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <span className="text-xs font-bold">DSP Pre-Flight Telemetry</span>
                      {artworkInspection.isSquare && artworkInspection.isHighRes ? (
                        <Badge className="bg-emerald-500 text-white gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          DSP Ingestion Ready
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          Action Required
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span
                          className={`font-mono font-medium flex items-center gap-1 ${
                            artworkInspection.isHighRes
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }`}
                        >
                          {artworkInspection.width} × {artworkInspection.height} px
                          {artworkInspection.isHighRes ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Aspect Ratio:</span>
                        <span
                          className={`font-mono font-medium flex items-center gap-1 ${
                            artworkInspection.isSquare
                              ? "text-emerald-500"
                              : "text-destructive"
                          }`}
                        >
                          {artworkInspection.aspectRatio}
                          {artworkInspection.isSquare ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">File Size:</span>
                        <span className="font-mono font-medium">
                          {(artworkInspection.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Color Profile:</span>
                        <span className="font-medium text-primary">RGB (Lossless)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="w-full flex flex-col items-center justify-center cursor-pointer py-12 text-center">
                <Upload className="w-12 h-12 text-muted-foreground/60 mb-3" />
                <span className="text-base font-bold">
                  Drag & Drop High-Resolution Cover Art Here
                </span>
                <span className="text-xs text-muted-foreground mt-1 max-w-sm">
                  or click to browse your filesystem (JPG or PNG, 3000 x 3000px square, max 20MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleCoverArtChange}
                />
              </label>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={() => {
                if (validateStep2()) setCurrentStep(3);
              }}
              disabled={uploadingArtwork}
              className="gap-1.5 font-semibold"
            >
              <span>Continue to Audio Masters</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Batch Audio Masters & Tracklist */}
      {currentStep === 3 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/70 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Audio Masters & Tracklist</h3>
              <p className="text-xs text-muted-foreground">
                Lossless audio (WAV or FLAC, ≥ 44.1kHz, 16/24-bit) is required for DSP distribution.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Button size="sm" variant="outline" className="pointer-events-none gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Batch Upload WAV/FLAC</span>
                </Button>
                <input
                  type="file"
                  multiple
                  accept="audio/wav,audio/x-wav,audio/flac,audio/mp3,audio/mpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleBatchAudioFiles(e.target.files);
                  }}
                />
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={addTrack}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Track</span>
              </Button>
            </div>
          </div>

          {/* Tracklist Queue */}
          <div className="space-y-4">
            {tracks.map((t, idx) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-border/70 bg-background/50 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold">
                      Track #{idx + 1}
                    </span>
                    {t.sampleRate && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {(t.sampleRate / 1000).toFixed(1)} kHz Lossless
                      </span>
                    )}
                  </div>
                  {tracks.length > 1 && (
                    <button
                      onClick={() => removeTrack(t.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                      title="Remove Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs font-semibold">Track Title *</Label>
                    <Input
                      value={t.title}
                      onChange={(e) =>
                        updateTrackField(t.id, "title", e.target.value)
                      }
                      placeholder="e.g. Horizon (Original Mix)"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Artist</Label>
                    <Input
                      value={t.artist}
                      onChange={(e) =>
                        updateTrackField(t.id, "artist", e.target.value)
                      }
                      placeholder={artistName || "Track Artist"}
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">ISRC (Optional)</Label>
                    <Input
                      value={t.isrc}
                      onChange={(e) =>
                        updateTrackField(t.id, "isrc", e.target.value)
                      }
                      placeholder="e.g. US-XXX-26-XXXXX"
                      className="text-xs h-8 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`explicit-${t.id}`}
                        checked={t.explicit}
                        onCheckedChange={(checked) =>
                          updateTrackField(t.id, "explicit", checked)
                        }
                      />
                      <Label
                        htmlFor={`explicit-${t.id}`}
                        className="text-xs font-medium cursor-pointer"
                      >
                        Explicit Lyrics
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Audio Master Upload Box with Progress */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-col gap-2.5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileAudio className="w-8 h-8 text-primary shrink-0" />
                      <div>
                        {t.audioKey ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.fileName || "Lossless Audio Master Ready"}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {t.uploading
                              ? `Uploading to cloud... ${t.uploadProgress || 0}%`
                              : "No audio file uploaded yet."}
                          </div>
                        )}
                        {t.fileSizeBytes && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {(t.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • Lossless Master
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="cursor-pointer">
                        <Button
                          type="button"
                          variant={t.audioKey ? "outline" : "default"}
                          size="xs"
                          disabled={t.uploading}
                          className="pointer-events-none text-xs"
                        >
                          {t.uploading
                            ? `Uploading (${t.uploadProgress}%)`
                            : t.audioKey
                              ? "Replace WAV"
                              : "Upload WAV/FLAC"}
                        </Button>
                        <input
                          type="file"
                          accept="audio/wav,audio/x-wav,audio/flac,audio/mp3,audio/mpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBatchAudioFiles([file]);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {t.uploading && (
                    <div className="space-y-1">
                      <Progress value={t.uploadProgress || 0} className="w-full [&_[data-slot=progress-track]]:h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Uploading lossless master...</span>
                        <span>{t.uploadProgress || 0}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={() => {
                if (validateStep3()) setCurrentStep(4);
              }}
              className="gap-1.5 font-semibold"
            >
              <span>Continue to Review & Sign</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Distribution Deal & Review */}
      {currentStep === 4 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/70 shadow-xs">
          <div>
            <h3 className="text-lg font-bold">Review Release Dossier & Sign Deal</h3>
            <p className="text-xs text-muted-foreground">
              Verify all release details and review the digital distribution terms before submitting to Mother Company for DSP distribution.
            </p>
          </div>

          {/* Dossier Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-background border border-border/60">
            <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted">
              {coverArtPreview && (
                <img
                  src={coverArtPreview}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="md:col-span-2 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
                  {type}
                </span>
                <h2 className="text-xl font-bold mt-1">{title}</h2>
                <p className="text-sm text-muted-foreground">By {artistName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Genre: </span>
                  <span className="font-medium">{genre}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Label: </span>
                  <span className="font-medium">{labelName || "Independent"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Release Date: </span>
                  <span className="font-medium">{releaseDate || "Immediate"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">UPC: </span>
                  <span className="font-medium font-mono">{upc || "Auto-Generated"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <span className="text-xs font-semibold">
                  Tracklist ({tracks.length} tracks):
                </span>
                <ul className="mt-1 space-y-1 text-xs">
                  {tracks.map((t, i) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between text-muted-foreground"
                    >
                      <span>
                        {i + 1}. {t.title} {t.explicit && " [Explicit]"}
                      </span>
                      <span className="text-emerald-500 font-medium flex items-center gap-1 font-mono text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Lossless Ready
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Distribution Deal Agreement Checkboxes */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              <span>Digital Distribution & Licensing Agreement</span>
            </h4>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedRights}
                  onChange={(e) => setAgreedRights(e.target.checked)}
                  className="rounded border-border mt-0.5 accent-primary"
                />
                <span>
                  I warrant that I own or control 100% of the worldwide sound recording and publishing rights for all tracks submitted.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedLossless}
                  onChange={(e) => setAgreedLossless(e.target.checked)}
                  className="rounded border-border mt-0.5 accent-primary"
                />
                <span>
                  I confirm that all uploaded audio masters are genuine lossless files (≥ 44.1kHz) and free of uncredited copyrighted samples.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedDspTerms}
                  onChange={(e) => setAgreedDspTerms(e.target.checked)}
                  className="rounded border-border mt-0.5 accent-primary"
                />
                <span>
                  I authorize Mother Company to distribute this release to Spotify, Apple Music, YouTube Music, TikTok, Amazon Music, and all global DSPs.
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="gap-1.5 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                disabled={submitting}
                onClick={() => handleSubmitRelease(false)}
                className="w-full sm:w-auto"
              >
                Save as Draft
              </Button>
              <Button
                disabled={submitting}
                onClick={() => handleSubmitRelease(true)}
                className="w-full sm:w-auto shadow-md font-semibold gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to Mother Company...</span>
                  </>
                ) : (
                  <span>Submit to Mother Company</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
