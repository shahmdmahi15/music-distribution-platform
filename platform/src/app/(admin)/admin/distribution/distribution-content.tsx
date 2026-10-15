"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Release, ReleaseStatus, Track } from "@/types/distribution";
import {
  adminGetDistributionReleasesAction,
  adminGetReleaseDossierAction,
  adminUpdateReleaseStatusAction,
  adminExportReleaseAction,
  adminRescanTrackAction,
  adminGenerateDdexAction,
} from "@/actions/admin/distribution/admin-distribution.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Music,
  Search,
  Download,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Layers,
  Disc3,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileAudio,
  Radio,
  Code2,
  Copy,
  Check,
} from "lucide-react";

export function AdminDistributionContent() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Dossier modal state
  const [inspectCode, setInspectCode] = useState<string | null>(null);
  const [inspectRelease, setInspectRelease] = useState<Release | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [scanningTrackCode, setScanningTrackCode] = useState<string | null>(null);

  // DDEX ERN 4.3 XML Modal State
  const [showDdexModal, setShowDdexModal] = useState(false);
  const [ddexXml, setDdexXml] = useState<string>("");
  const [generatingDdex, setGeneratingDdex] = useState(false);
  const [copiedDdex, setCopiedDdex] = useState(false);

  const fetchReleases = () => {
    startTransition(async () => {
      setLoading(true);
      const res = await adminGetDistributionReleasesAction({
        search: search.trim() || undefined,
        status:
          selectedStatus === "ALL"
            ? undefined
            : (selectedStatus as ReleaseStatus),
        limit: 50,
      });

      if (res.success) {
        setReleases(res.data);
      } else {
        toast.error(res.message);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchReleases();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReleases();
  };

  // Inspect Release Dossier
  const handleInspect = async (code: string) => {
    setInspectCode(code);
    setLoadingDossier(true);
    setShowRejectInput(false);
    setRejectionReason("");

    const res = await adminGetReleaseDossierAction(code);
    if (res.success && res.release) {
      setInspectRelease(res.release);
    } else {
      toast.error(res.message || "Failed to load release dossier");
      setInspectCode(null);
    }
    setLoadingDossier(false);
  };

  // Update Status (Distributed, Approved, Rejected)
  const handleStatusUpdate = async (newStatus: ReleaseStatus) => {
    if (!inspectCode) return;

    if (newStatus === "REJECTED" && !rejectionReason.trim()) {
      setShowRejectInput(true);
      toast.error("Please provide a rejection reason for the WhiteLabel.");
      return;
    }

    setUpdatingStatus(true);
    const res = await adminUpdateReleaseStatusAction(inspectCode, {
      status: newStatus,
      rejectionReason:
        newStatus === "REJECTED" ? rejectionReason.trim() : undefined,
    });

    if (res.success) {
      toast.success(`Release marked as ${newStatus}!`);
      setInspectCode(null);
      fetchReleases();
    } else {
      toast.error(res.message);
    }
    setUpdatingStatus(false);
  };

  // Export JSON Manifest for DSP ingestion
  const handleExport = async (code: string) => {
    const res = await adminExportReleaseAction(code);
    if (res.success && res.bundle) {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(res.bundle, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${code}-dsp-manifest.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("DSP metadata manifest downloaded!");
    } else {
      toast.error(res.message || "Failed to export release metadata");
    }
  };

  // Generate DDEX ERN 4.3 XML Handler
  const handleGenerateDdex = async (code: string) => {
    setGeneratingDdex(true);
    try {
      const res = await adminGenerateDdexAction(code);
      if (res.success && res.xml) {
        setDdexXml(res.xml);
        setShowDdexModal(true);
        toast.success("DDEX ERN 4.3 XML feed successfully generated!");
      } else {
        toast.error(res.message || "Failed to generate DDEX ERN 4.3 feed");
      }
    } catch (err: any) {
      toast.error("DDEX error: " + err.message);
    } finally {
      setGeneratingDdex(false);
    }
  };

  const handleCopyDdexXml = () => {
    navigator.clipboard.writeText(ddexXml);
    setCopiedDdex(true);
    toast.success("DDEX ERN 4.3 XML copied to clipboard!");
    setTimeout(() => setCopiedDdex(false), 2000);
  };

  const handleDownloadDdexXml = () => {
    if (!ddexXml || !inspectRelease) return;
    const blob = new Blob([ddexXml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `${inspectRelease.code}_ddex_ern43.xml`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${inspectRelease.code}_ddex_ern43.xml`);
  };

  const handleRescanTrack = async (trackCode: string) => {
    setScanningTrackCode(trackCode);
    try {
      const res = await adminRescanTrackAction(trackCode);
      if (res.success) {
        toast.success("ACRCloud scan updated successfully!");
        if (inspectCode) {
          const dossierRes = await adminGetReleaseDossierAction(inspectCode);
          if (dossierRes.success && dossierRes.release) {
            setInspectRelease(dossierRes.release);
          }
        }
      } else {
        toast.error(res.message || "Failed to scan track");
      }
    } catch (err: any) {
      toast.error(err.message || "Scanning error");
    } finally {
      setScanningTrackCode(null);
    }
  };

  const renderAudioScanBadge = (track: Track) => {
    const scan = track.audioScan;
    if (!scan) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground bg-muted border border-border/50">
          Unscanned
        </span>
      );
    }

    if (scan.status === "CLEAN") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          ACRCloud: Clean (No Infringement)
        </span>
      );
    }

    if (scan.status === "MATCH_FOUND") {
      return (
        <div className="flex flex-col gap-1 mt-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 w-fit">
            <AlertCircle className="w-3 h-3" />
            Copyright Match Found ({scan.matchScore || 100}%)
          </span>
          <div className="text-[10px] text-rose-400/90 font-mono pl-1 space-y-0.5">
            <div>
              Matched Title: <span className="font-semibold">{scan.matchedTitle || "Unknown"}</span>
            </div>
            <div>
              Artist: <span className="font-semibold">{scan.matchedArtist || "Unknown"}</span>
              {scan.matchedAlbum && <span> • Album: {scan.matchedAlbum}</span>}
            </div>
            {(scan.matchedIsrc || scan.matchedLabel) && (
              <div className="text-[9px] text-muted-foreground">
                {scan.matchedIsrc && <span>ISRC: {scan.matchedIsrc} </span>}
                {scan.matchedLabel && <span>• Label: {scan.matchedLabel}</span>}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (scan.status === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-3 h-3 animate-spin" />
          Scan Pending...
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="w-3 h-3" />
        Scan Failed: {scan.errorMessage || "Recognition Error"}
      </span>
    );
  };

  const getStatusBadge = (status: ReleaseStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Draft</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Submitted</Badge>;
      case "IN_REVIEW":
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">In Review</Badge>;
      case "APPROVED":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved</Badge>;
      case "DISTRIBUTED":
        return <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">Distributed to DSPs</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "TAKEDOWN":
        return <Badge variant="outline" className="text-zinc-500">Takedown</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusTabs = [
    { label: "All Releases", value: "ALL" },
    { label: "Submitted Queue", value: "SUBMITTED" },
    { label: "In Review", value: "IN_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "Distributed", value: "DISTRIBUTED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
          <Disc3 className="w-4 h-4" />
          <span>Mother Platform Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Music Distribution Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review releases submitted by WhiteLabel companies, inspect lossless audio, generate DDEX ERN 4.3 XML feeds, and publish distributions to DSPs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === tab.value
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full sm:w-72 flex items-center"
        >
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search release, UPC, label..."
            className="pl-9 text-xs h-9"
          />
        </form>
      </div>

      {/* Releases Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Music className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No releases found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              No WhiteLabel releases match your current search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Cover</TableHead>
                  <TableHead>Release & WhiteLabel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tracks</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((rel) => (
                  <TableRow key={rel.id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden border border-border/50">
                        {rel.presignedCoverUrl || rel.coverArtUrl ? (
                          <img
                            src={rel.presignedCoverUrl || rel.coverArtUrl}
                            alt={rel.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <span>{rel.title}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({rel.code})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Building2 className="w-3 h-3" />
                            {rel.whiteLabel?.name || "WhiteLabel Tenant"}
                          </span>
                          <span>•</span>
                          <span>{rel.genre}</span>
                          {rel.upc && <span>• UPC: {rel.upc}</span>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {rel.type}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {rel.trackCount || 0} tracks
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {rel.submittedAt
                        ? new Date(rel.submittedAt).toLocaleDateString()
                        : "Draft"}
                    </TableCell>

                    <TableCell>{getStatusBadge(rel.status)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInspect(rel.code)}
                          className="text-xs h-8"
                        >
                          Inspect & Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Release Dossier & Download Modal */}
      <Dialog
        open={!!inspectCode}
        onOpenChange={(open) => {
          if (!open) setInspectCode(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-primary" />
              <span>Release Dossier & DSP Assets</span>
            </DialogTitle>
            <DialogDescription>
              Download original lossless audio files and artwork, generate DDEX ERN 4.3 XML, or export structured JSON metadata for DSP distribution.
            </DialogDescription>
          </DialogHeader>

          {loadingDossier || !inspectRelease ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Release Overview Banner */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-background border border-border/70">
                  {inspectRelease.coverArtDownloadUrl ||
                  inspectRelease.coverArtUrl ? (
                    <img
                      src={
                        inspectRelease.coverArtDownloadUrl ||
                        inspectRelease.coverArtUrl
                      }
                      alt={inspectRelease.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Music className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(inspectRelease.status)}
                      <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {inspectRelease.type}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {inspectRelease.code}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold mt-1 text-foreground">
                      {inspectRelease.title}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Tenant:{" "}
                      <span className="font-semibold text-foreground">
                        {inspectRelease.whiteLabel?.name}
                      </span>{" "}
                      • Label: {inspectRelease.labelName || "Independent"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {inspectRelease.coverArtDownloadUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1.5"
                        onClick={() =>
                          window.open(
                            inspectRelease.coverArtDownloadUrl,
                            "_blank",
                          )
                        }
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Artwork</span>
                      </Button>
                    )}

                    {/* Generate DDEX ERN 4.3 XML Action Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                      disabled={generatingDdex}
                      onClick={() => handleGenerateDdex(inspectRelease.code)}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{generatingDdex ? "Generating DDEX..." : "Generate DDEX ERN 4.3 XML"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1.5"
                      onClick={() => handleExport(inspectRelease.code)}
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>Export DSP Manifest (JSON)</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tracks Section with Lossless Download */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4 text-primary" />
                  <span>Tracks ({inspectRelease.tracks?.length || 0})</span>
                </h4>

                <div className="divide-y divide-border/50 border border-border/60 rounded-xl overflow-hidden bg-background">
                  {inspectRelease.tracks && inspectRelease.tracks.length > 0 ? (
                    inspectRelease.tracks.map((track) => (
                      <div
                        key={track.id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-muted-foreground w-5">
                            {String(track.trackNumber).padStart(2, "0")}
                          </span>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{track.title}</span>
                              {track.explicit && (
                                <span className="text-[9px] font-bold px-1 rounded bg-destructive/10 text-destructive">
                                  EXPLICIT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              {track.isrc && <span>ISRC: {track.isrc}</span>}
                              {track.fileName && <span>• {track.fileName}</span>}
                            </div>
                            <div className="mt-1.5">
                              {renderAudioScanBadge(track)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {track.audioDownloadUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={scanningTrackCode === track.code}
                              className="text-xs h-7 gap-1"
                              onClick={() => handleRescanTrack(track.code)}
                            >
                              <Radio
                                className={`w-3 h-3 ${
                                  scanningTrackCode === track.code
                                    ? "animate-pulse text-primary"
                                    : ""
                                }`}
                              />
                              <span>
                                {scanningTrackCode === track.code
                                  ? "Scanning..."
                                  : "Re-scan"}
                              </span>
                            </Button>
                          )}

                          {track.audioDownloadUrl ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs h-7 gap-1"
                              onClick={() =>
                                window.open(track.audioDownloadUrl, "_blank")
                              }
                            >
                              <Download className="w-3 h-3" />
                              <span>Download Audio</span>
                            </Button>
                          ) : (
                            <span className="text-destructive font-medium text-[11px]">
                              No Audio
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No tracks found in release dossier.
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Input (Conditional) */}
              {showRejectInput && (
                <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 space-y-2">
                  <span className="text-xs font-semibold text-destructive">
                    Reason for Rejection (Visible to WhiteLabel):
                  </span>
                  <Input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Lossless audio has clipping / Artwork does not meet 3000x3000px resolution."
                    className="text-xs bg-background"
                  />
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectCode(null)}
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {inspectRelease.status !== "REJECTED" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate("REJECTED")}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Reject</span>
                    </Button>
                  )}

                  {inspectRelease.status !== "APPROVED" &&
                    inspectRelease.status !== "DISTRIBUTED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={updatingStatus}
                        onClick={() => handleStatusUpdate("APPROVED")}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        <span>Approve</span>
                      </Button>
                    )}

                  {inspectRelease.status !== "DISTRIBUTED" && (
                    <Button
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate("DISTRIBUTED")}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Mark as Distributed to DSPs</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DDEX ERN 4.3 XML Inspection & Export Modal */}
      <Dialog open={showDdexModal} onOpenChange={setShowDdexModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <span>DDEX ERN 4.3 XML Feed</span>
              </DialogTitle>
              <div className="flex items-center gap-2 pr-6">
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
                  ERN 4.3 CERTIFIED
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px]">
                  UTF-8
                </Badge>
              </div>
            </div>
            <DialogDescription>
              Electronic Release Notification (ERN) 4.3 XML payload structured for automated ingestion by Spotify, Apple Music, YouTube, and Amazon Music.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-2 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pb-1">
              <span>Catalog Schema: <code className="text-foreground">http://ddex.net/xml/ern/43</code></span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDdexXml}
                  className="h-7 text-xs gap-1.5"
                >
                  {copiedDdex ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDdex ? "Copied!" : "Copy XML"}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleDownloadDdexXml}
                  className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .xml File</span>
                </Button>
              </div>
            </div>

            {/* XML Display Container */}
            <div className="flex-1 overflow-auto rounded-xl bg-zinc-950 p-4 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed max-h-[55vh]">
              <pre className="whitespace-pre">{ddexXml}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
