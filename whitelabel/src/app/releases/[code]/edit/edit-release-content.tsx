"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Release, Track, ReleaseValidationResult } from "@/types/catalog";
import {
  wlGetReleaseAction,
  wlUpdateReleaseAction,
  wlAddTrackAction,
  wlDeleteTrackAction,
  wlSubmitReleaseAction,
  wlGetUploadUrlAction,
  validateReleaseAction,
} from "@/actions/catalog/whitelabel-catalog.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
  Loader2,
  Save,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Info,
} from "lucide-react";

interface NewTrackDraft {
  title: string;
  isrc: string;
  explicit: boolean;
  audioKey?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  uploading?: boolean;
}

export function EditReleaseContent({ code }: { code: string }) {
  const router = useRouter();
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [qcResult, setQcResult] = useState<ReleaseValidationResult | null>(null);

  // Editable Form Fields
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [labelName, setLabelName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [upc, setUpc] = useState("");
  const [cLine, setCLine] = useState("");
  const [pLine, setPLine] = useState("");

  // Artwork
  const [coverArtKey, setCoverArtKey] = useState<string>("");
  const [coverArtPreview, setCoverArtPreview] = useState<string>("");
  const [uploadingArtwork, setUploadingArtwork] = useState(false);

  // New Track Draft
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [newTrack, setNewTrack] = useState<NewTrackDraft>({
    title: "",
    isrc: "",
    explicit: false,
  });
  const [addingTrack, setAddingTrack] = useState(false);

  const fetchRelease = async () => {
    setLoading(true);
    const res = await wlGetReleaseAction(code);
    if (res.success && res.release) {
      const r = res.release;
      setRelease(r);
      setTitle(r.title);
      setGenre(r.genre || "Pop");
      setSubgenre(r.subgenre || "");
      setLabelName(r.labelName || "");
      setReleaseDate(r.releaseDate ? r.releaseDate.split("T")[0] : "");
      setUpc(r.upc || "");
      setCLine(r.cLine || "");
      setPLine(r.pLine || "");
      setCoverArtKey(r.coverArtKey || "");
      setCoverArtPreview(r.presignedCoverUrl || r.coverArtUrl || "");
    } else {
      toast.error(res.message || "Failed to load release");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRelease();
  }, [code]);

  // Quality Control Pre-flight Validation
  const handleValidateQC = async () => {
    setValidating(true);
    try {
      const res = await validateReleaseAction(code);
      if (res.success && res.validation) {
        setQcResult(res.validation);
        if (res.validation.isValid) {
          toast.success("Pre-flight QC passed! Release conforms to DSP standards.");
        } else {
          toast.error(
            `QC Found ${res.validation.errors.length} fatal error(s) preventing submission.`,
          );
        }
      } else {
        toast.error(res.message || "Validation check could not be completed.");
      }
    } catch (err: any) {
      toast.error("QC Validation failed: " + err.message);
    } finally {
      setValidating(false);
    }
  };

  // Handle Cover Art Upload
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
      toast.success("Artwork uploaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload artwork.");
    } finally {
      setUploadingArtwork(false);
    }
  };

  // Handle Track Audio Upload for new track
  const handleNewTrackAudioChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewTrack((prev) => ({ ...prev, uploading: true }));

    try {
      const urlRes = await wlGetUploadUrlAction({
        type: "AUDIO",
        fileName: file.name,
        mimeType: file.type,
      });

      if (!urlRes.success || !urlRes.uploadUrl || !urlRes.key) {
        throw new Error(urlRes.message || "Failed to get audio upload URL");
      }

      await axios.put(urlRes.uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      setNewTrack((prev) => ({
        ...prev,
        audioKey: urlRes.key,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        uploading: false,
      }));

      toast.success("Lossless audio uploaded successfully.");
    } catch (err: any) {
      setNewTrack((prev) => ({ ...prev, uploading: false }));
      toast.error(err.message || "Failed to upload audio file.");
    }
  };

  const handleCreateTrack = async () => {
    if (!newTrack.title.trim()) {
      toast.error("Track title is required.");
      return;
    }
    if (!newTrack.audioKey) {
      toast.error("Track audio file is required.");
      return;
    }

    setAddingTrack(true);
    try {
      const res = await wlAddTrackAction(code, {
        title: newTrack.title.trim(),
        isrc: newTrack.isrc.trim() || undefined,
        explicit: newTrack.explicit,
        audioKey: newTrack.audioKey,
        fileName: newTrack.fileName,
        fileSizeBytes: newTrack.fileSizeBytes,
        mimeType: newTrack.mimeType,
      });

      if (res.success) {
        toast.success("Track added to release.");
        setNewTrack({ title: "", isrc: "", explicit: false });
        setShowAddTrack(false);
        fetchRelease();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("Failed to add track: " + err.message);
    } finally {
      setAddingTrack(false);
    }
  };

  const handleDeleteTrack = async (trackCode: string) => {
    if (!confirm("Are you sure you want to delete this track?")) return;
    try {
      const res = await wlDeleteTrackAction(code, trackCode);
      if (res.success) {
        toast.success(res.message);
        fetchRelease();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("Failed to delete track: " + err.message);
    }
  };

  const handleSaveChanges = async () => {
    if (!title.trim()) {
      toast.error("Release title is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await wlUpdateReleaseAction(code, {
        title: title.trim(),
        genre: genre.trim(),
        subgenre: subgenre.trim() || undefined,
        labelName: labelName.trim() || undefined,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
        upc: upc.trim() || undefined,
        cLine: cLine.trim() || undefined,
        pLine: pLine.trim() || undefined,
        coverArtKey: coverArtKey || undefined,
      });

      if (res.success) {
        toast.success("Release changes saved successfully.");
        fetchRelease();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("Failed to save changes: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async () => {
    // If QC has been run and contains fatal errors, prevent submission
    if (qcResult && qcResult.errors.length > 0) {
      toast.error(
        `Cannot submit: ${qcResult.errors.length} fatal QC error(s) must be resolved first.`,
      );
      return;
    }

    setResubmitting(true);
    try {
      // First save current metadata changes
      await wlUpdateReleaseAction(code, {
        title: title.trim(),
        genre: genre.trim(),
        subgenre: subgenre.trim() || undefined,
        labelName: labelName.trim() || undefined,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
        upc: upc.trim() || undefined,
        cLine: cLine.trim() || undefined,
        pLine: pLine.trim() || undefined,
        coverArtKey: coverArtKey || undefined,
      });

      // Then submit release for Mother Company DSP distribution
      const submitRes = await wlSubmitReleaseAction(code);
      if (submitRes.success) {
        toast.success(submitRes.message);
        router.push(`/releases/${code}`);
      } else {
        toast.error(submitRes.message);
      }
    } catch (err: any) {
      toast.error("Failed to submit release: " + err.message);
    } finally {
      setResubmitting(false);
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
        <Button render={<Link href="/releases">Return to Releases</Link>} />
      </div>
    );
  }

  const hasFatalQcErrors = qcResult !== null && qcResult.errors.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`/releases/${code}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Release Details</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Pre-flight Quality Check Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleValidateQC}
            disabled={validating || saving || resubmitting}
            className="flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            {validating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{validating ? "Running QC..." : "Pre-flight Quality Check"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveChanges}
            disabled={saving || resubmitting || validating}
            className="flex items-center gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Draft</span>
          </Button>

          <Button
            size="sm"
            onClick={handleResubmit}
            disabled={saving || resubmitting || hasFatalQcErrors}
            className={`flex items-center gap-1.5 shadow-sm ${
              hasFatalQcErrors ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {resubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Resubmit to Mother Company</span>
          </Button>
        </div>
      </div>

      {/* QC Validation Results Card */}
      {qcResult && (
        <div className="space-y-4">
          {/* Severity 1: Fatal Errors Banner */}
          {qcResult.errors.length > 0 && (
            <div className="p-5 rounded-2xl border-2 border-destructive/60 bg-destructive/10 text-destructive space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>Severity 1: Fatal QC Errors ({qcResult.errors.length})</span>
                </div>
                <Badge variant="destructive" className="font-mono text-[10px]">
                  SUBMISSION BLOCKED
                </Badge>
              </div>

              <p className="text-xs text-destructive/90 leading-relaxed font-medium">
                The release <strong>CANNOT</strong> be submitted to Mother Company or DSPs until all fatal errors below are resolved:
              </p>

              <ul className="space-y-2 pt-1 border-t border-destructive/20">
                {qcResult.errors.map((err, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs bg-background/60 p-2.5 rounded-lg border border-destructive/30"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                    <div>
                      <span className="font-semibold block">{err.message}</span>
                      {err.trackTitle && (
                        <span className="text-[11px] opacity-80 font-mono">
                          Track: {err.trackTitle}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Severity 2: Warnings Banner */}
          {qcResult.warnings.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Severity 2: Advisory Warnings ({qcResult.warnings.length})</span>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-amber-500">
                  Non-blocking
                </span>
              </div>

              <ul className="space-y-1.5 pt-1 text-xs">
                {qcResult.warnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{warn.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Passed Clean Badge Card */}
          {qcResult.passed && qcResult.errors.length === 0 && (
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Passed Pre-flight Quality Inspection</h4>
                  <p className="text-xs opacity-90">
                    Release metadata, artwork, and lossless audio conform to Revelator and DSP delivery standards.
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 shrink-0">
                QC Clean
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Rejection Alert Banner */}
      {release.status === "REJECTED" && (
        <div className="p-4 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Release Was Rejected by Mother Company Staff</h4>
            <p className="text-xs">
              Reason: {release.rejectionReason || "Please fix metadata or re-upload high quality audio files."}
            </p>
            <p className="text-[11px] opacity-80 mt-1">
              Please address the reason above by updating metadata, replacing artwork, or re-uploading audio, then click "Resubmit to Mother Company".
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Release: {release.title}</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Catalog Code: {release.code} • Status: {release.status}
        </p>
      </div>

      {/* Release Metadata Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
        <h3 className="text-base font-semibold text-foreground">Release Metadata</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Release Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Memories"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Primary Genre *</Label>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Pop, Electronic, Hip Hop..."
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subgenre</Label>
            <Input
              value={subgenre}
              onChange={(e) => setSubgenre(e.target.value)}
              placeholder="Synthwave, Lo-Fi, Trap..."
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Record Label</Label>
            <Input
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="Record Label Name"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Target Release Date</Label>
            <Input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">UPC / EAN</Label>
            <Input
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              placeholder="Leave blank to auto-assign"
              className="text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Copyright Line (C-Line)</Label>
            <Input
              value={cLine}
              onChange={(e) => setCLine(e.target.value)}
              placeholder="e.g. 2026 Synth Records"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Publishing Line (P-Line)</Label>
            <Input
              value={pLine}
              onChange={(e) => setPLine(e.target.value)}
              placeholder="e.g. 2026 Synth Publishing"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Cover Artwork Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-foreground">Cover Artwork</h3>
        <p className="text-xs text-muted-foreground">
          Square format recommended: 3000x3000px, RGB JPEG/PNG without borders or logos.
        </p>

        <div className="flex flex-col sm:flex-row items-start gap-6 pt-2">
          <div className="w-40 h-40 shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border shadow-xs flex items-center justify-center">
            {coverArtPreview ? (
              <img
                src={coverArtPreview}
                alt="Artwork preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex flex-col items-center">
                <Music className="w-8 h-8 mb-1" />
                <span className="text-[10px]">No Artwork</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Replace Artwork</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleCoverArtChange}
                disabled={uploadingArtwork}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
              />
              {uploadingArtwork && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {coverArtKey && (
              <p className="text-xs text-emerald-500 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Artwork ready in storage
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tracks Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Tracks ({release.tracks?.length || 0})
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddTrack(!showAddTrack)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Track</span>
          </Button>
        </div>

        {/* Existing Tracklist */}
        <div className="divide-y divide-border/40 rounded-xl border border-border/50 overflow-hidden">
          {release.tracks && release.tracks.length > 0 ? (
            release.tracks.map((track) => (
              <div
                key={track.id}
                className="p-3.5 flex items-center justify-between gap-4 bg-background/50 hover:bg-muted/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{track.trackNumber}
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
                </div>

                <div className="flex items-center gap-3">
                  {track.audioKey ? (
                    <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Lossless Audio Uploaded
                    </span>
                  ) : (
                    <span className="text-xs text-destructive font-medium">
                      Missing Audio
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteTrack(track.code)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete Track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No tracks uploaded yet.
            </div>
          )}
        </div>

        {/* Add Track Sub-form */}
        {showAddTrack && (
          <div className="p-4 rounded-xl border border-border/80 bg-accent/20 space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add New Track
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Track Title *</Label>
                <Input
                  value={newTrack.title}
                  onChange={(e) =>
                    setNewTrack((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Track Title"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">ISRC (Optional)</Label>
                <Input
                  value={newTrack.isrc}
                  onChange={(e) =>
                    setNewTrack((prev) => ({ ...prev, isrc: e.target.value }))
                  }
                  placeholder="e.g. US-XYZ-26-00001"
                  className="text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Lossless Audio File (WAV/FLAC) *</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="audio/wav,audio/x-wav,audio/flac,audio/mpeg"
                    onChange={handleNewTrackAudioChange}
                    disabled={newTrack.uploading}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                  />
                  {newTrack.uploading && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {newTrack.audioKey && (
                  <p className="text-xs text-emerald-500 font-medium flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Audio file uploaded ({newTrack.fileName})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 sm:col-span-2 pt-1">
                <Switch
                  checked={newTrack.explicit}
                  onCheckedChange={(checked) =>
                    setNewTrack((prev) => ({ ...prev, explicit: checked }))
                  }
                />
                <Label className="text-xs cursor-pointer">
                  Explicit Content Advisory
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddTrack(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateTrack}
                disabled={addingTrack || newTrack.uploading}
                className="text-xs"
              >
                {addingTrack ? "Adding Track..." : "Save Track"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
