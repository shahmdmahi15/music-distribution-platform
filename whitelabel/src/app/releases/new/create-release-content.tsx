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
  uploading?: boolean;
  uploadProgress?: number;
}

export function CreateReleaseContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Release Info
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"SINGLE" | "EP" | "ALBUM">("SINGLE");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [subgenre, setSubgenre] = useState("");
  const [labelName, setLabelName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [upc, setUpc] = useState("");
  const [cLine, setCLine] = useState("");
  const [pLine, setPLine] = useState("");

  // Step 2: Cover Artwork
  const [coverArtKey, setCoverArtKey] = useState<string>("");
  const [coverArtPreview, setCoverArtPreview] = useState<string>("");
  const [uploadingArtwork, setUploadingArtwork] = useState(false);

  // Step 3: Tracks
  const [tracks, setTracks] = useState<TrackDraft[]>([
    {
      id: "track-1",
      title: "",
      artist: "",
      isrc: "",
      explicit: false,
    },
  ]);

  // Handle Cover Art Direct Upload
  const handleCoverArtChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPEG or PNG).");
      return;
    }

    setUploadingArtwork(true);
    const localPreview = URL.createObjectURL(file);
    setCoverArtPreview(localPreview);

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
      toast.success("Cover artwork uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload artwork: " + (err.message || "Error"));
    } finally {
      setUploadingArtwork(false);
    }
  };

  // Add / Remove Track Rows
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

  // Direct Audio Upload
  const handleAudioFileChange = async (
    trackId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    updateTrackField(trackId, "uploading", true);
    updateTrackField(trackId, "uploadProgress", 10);
    updateTrackField(trackId, "fileName", file.name);
    updateTrackField(trackId, "fileSizeBytes", file.size);
    updateTrackField(trackId, "mimeType", file.type || "audio/wav");

    try {
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
            updateTrackField(trackId, "uploadProgress", percent);
          }
        },
      });

      updateTrackField(trackId, "audioKey", urlRes.key);
      updateTrackField(trackId, "uploading", false);
      toast.success(`Audio uploaded for track: ${file.name}`);
    } catch (err: any) {
      updateTrackField(trackId, "uploading", false);
      toast.error(`Audio upload failed: ${err.message || "Error"}`);
    }
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
      if (!t.audioKey) {
        toast.error(`Track #${i + 1} ("${t.title}") is missing an audio file.`);
        return false;
      }
    }
    return true;
  };

  // Handle final release submission
  const handleSubmitRelease = async (submitToMother: boolean) => {
    setSubmitting(true);
    try {
      // 1. Create release draft
      const releaseRes = await wlCreateReleaseAction({
        title,
        type,
        genre,
        subgenre: subgenre || undefined,
        labelName: labelName || undefined,
        releaseDate: releaseDate || undefined,
        upc: upc || undefined,
        cLine: cLine || undefined,
        pLine: pLine || undefined,
        coverArtKey,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          New Music Release
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Provide release metadata, lossless audio files, and high-resolution cover art.
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-4 gap-2 border-b border-border/60 pb-4">
        {[
          { step: 1, name: "Release Info" },
          { step: 2, name: "Cover Art" },
          { step: 3, name: "Tracklist & Audio" },
          { step: 4, name: "Review & Submit" },
        ].map((s) => (
          <div
            key={s.step}
            className={`flex flex-col border-t-2 pt-2 transition-colors ${
              currentStep >= s.step
                ? "border-primary text-primary"
                : "border-border/40 text-muted-foreground"
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Step {s.step}
            </span>
            <span className="text-xs font-medium truncate">{s.name}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Release Info */}
      {currentStep === 1 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/60 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Release Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Serenade"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">Primary Artist *</Label>
              <Input
                id="artist"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g. Luna Eclipse"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Release Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "SINGLE" | "EP" | "ALBUM")
                }
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="SINGLE">Single</option>
                <option value="EP">EP</option>
                <option value="ALBUM">Album</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Primary Genre *</Label>
              <Input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Pop, Hip Hop, Electronic"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subgenre">Subgenre (Optional)</Label>
              <Input
                id="subgenre"
                value={subgenre}
                onChange={(e) => setSubgenre(e.target.value)}
                placeholder="e.g. Synthpop, Lo-fi"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Record Label Name</Label>
              <Input
                id="label"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="e.g. Royal Motion Records"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseDate">Target Release Date</Label>
              <Input
                id="releaseDate"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upc">UPC / EAN (Optional)</Label>
              <Input
                id="upc"
                value={upc}
                onChange={(e) => setUpc(e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cline">C-Line (Copyright)</Label>
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
              className="flex items-center gap-1.5"
            >
              <span>Continue to Artwork</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Cover Art */}
      {currentStep === 2 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/60 shadow-xs">
          <div className="text-center max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-semibold">Cover Artwork</h3>
            <p className="text-xs text-muted-foreground">
              DSP specifications: Minimum 3000 x 3000 pixels, square aspect ratio, RGB color mode, JPEG or PNG format.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            {coverArtPreview ? (
              <div className="relative group w-64 h-64 rounded-xl overflow-hidden border border-border/80 shadow-md">
                <img
                  src={coverArtPreview}
                  alt="Artwork Preview"
                  className="w-full h-full object-cover"
                />
                {uploadingArtwork && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-medium">
                    Uploading to cloud...
                  </div>
                )}
                {!uploadingArtwork && (
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Replace Image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handleCoverArtChange}
                    />
                  </label>
                )}
              </div>
            ) : (
              <label className="w-64 h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors p-6 text-center">
                <Upload className="w-10 h-10 text-muted-foreground/60 mb-3" />
                <span className="text-sm font-semibold">Click to upload artwork</span>
                <span className="text-xs text-muted-foreground mt-1">
                  JPG or PNG (3000x3000px)
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
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={() => {
                if (validateStep2()) setCurrentStep(3);
              }}
              disabled={uploadingArtwork}
              className="flex items-center gap-1.5"
            >
              <span>Continue to Tracklist</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Tracklist & Audio */}
      {currentStep === 3 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/60 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Tracks & Audio Files</h3>
              <p className="text-xs text-muted-foreground">
                Lossless audio (WAV or FLAC, 16/24-bit 44.1kHz or higher) is required for DSP distribution.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addTrack}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Track</span>
            </Button>
          </div>

          <div className="space-y-4">
            {tracks.map((t, idx) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-border/70 bg-background/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold">
                      Track #{idx + 1}
                    </span>
                  </div>
                  {tracks.length > 1 && (
                    <button
                      onClick={() => removeTrack(t.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Remove Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Track Title *</Label>
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
                    <Label className="text-xs">Artist</Label>
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
                    <Label className="text-xs">ISRC (Optional)</Label>
                    <Input
                      value={t.isrc}
                      onChange={(e) =>
                        updateTrackField(t.id, "isrc", e.target.value)
                      }
                      placeholder="e.g. US-XXX-26-XXXXX"
                      className="text-xs h-8"
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

                {/* Audio Upload Box */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-8 h-8 text-primary" />
                    <div>
                      {t.audioKey ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.fileName || "Lossless Audio Ready"}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {t.uploading
                            ? `Uploading... ${t.uploadProgress || 0}%`
                            : "No audio file uploaded yet."}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="cursor-pointer">
                      <Button
                        type="button"
                        variant={t.audioKey ? "outline" : "default"}
                        size="sm"
                        disabled={t.uploading}
                        className="pointer-events-none text-xs"
                      >
                        {t.uploading
                          ? "Uploading..."
                          : t.audioKey
                            ? "Replace Audio"
                            : "Upload WAV/FLAC"}
                      </Button>
                      <input
                        type="file"
                        accept="audio/wav,audio/x-wav,audio/flac,audio/mp3,audio/mpeg"
                        className="hidden"
                        onChange={(e) => handleAudioFileChange(t.id, e)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={() => {
                if (validateStep3()) setCurrentStep(4);
              }}
              className="flex items-center gap-1.5"
            >
              <span>Continue to Review</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Submit */}
      {currentStep === 4 && (
        <div className="space-y-6 bg-card p-6 rounded-2xl border border-border/60 shadow-xs">
          <div>
            <h3 className="text-lg font-semibold">Review Release Dossier</h3>
            <p className="text-xs text-muted-foreground">
              Verify all release details before submitting to Mother Company for DSP distribution.
            </p>
          </div>

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
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {type}
                </span>
                <h2 className="text-xl font-bold mt-1">{title}</h2>
                <p className="text-sm text-muted-foreground">
                  By {artistName}
                </p>
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
                  <span className="font-medium">{upc || "To be generated"}</span>
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
                      <span className="text-emerald-500 font-medium">Ready</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1.5 w-full sm:w-auto"
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
                className="w-full sm:w-auto shadow-md"
              >
                {submitting ? "Submitting..." : "Submit to Mother Company"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
