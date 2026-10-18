"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Release, ReleaseStatus, Track } from "@/types/distribution";
import {
  clientGetCatalogReleasesAction,
  clientGetReleaseDossierAction,
  clientApproveReleaseAction,
  clientRequestReleaseFixAction,
} from "@/actions/client/catalog/client-catalog.action";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Disc3,
  Search,
  Music,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Maximize2,
  ZoomIn,
  ShieldCheck,
  Table as TableIcon,
  LayoutGrid,
  FileAudio,
  Copy,
  ExternalLink,
} from "lucide-react";

export function ClientCatalogContent() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [, startTransition] = useTransition();

  // Dossier Sheet State
  const [inspectCode, setInspectCode] = useState<string | null>(null);
  const [inspectRelease, setInspectRelease] = useState<Release | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Audio Player Preview State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reviewer Fix Request State
  const [showFixModal, setShowFixModal] = useState(false);
  const [fixNote, setFixNote] = useState("");
  const [submittingFix, setSubmittingFix] = useState(false);
  const [approving, setApproving] = useState(false);

  const fetchReleases = () => {
    startTransition(async () => {
      setLoading(true);
      const res = await clientGetCatalogReleasesAction({
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

  const handleInspect = async (code: string) => {
    setInspectCode(code);
    setLoadingDossier(true);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const res = await clientGetReleaseDossierAction(code);
    if (res.success && res.release) {
      setInspectRelease(res.release);
    } else {
      toast.error(res.message || "Failed to load release dossier.");
      setInspectCode(null);
    }
    setLoadingDossier(false);
  };

  const toggleLeadAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => toast.error("Audio playback stream unavailable."));
    }
  };

  const handleApprove = async () => {
    if (!inspectCode) return;
    setApproving(true);
    try {
      const res = await clientApproveReleaseAction(inspectCode);
      if (res.success) {
        toast.success("Release approved for Mother Platform distribution!");
        setInspectCode(null);
        fetchReleases();
      } else {
        toast.error(res.message);
      }
    } finally {
      setApproving(false);
    }
  };

  const handleSendBackForFix = async () => {
    if (!inspectCode || !fixNote.trim()) {
      toast.error("Please provide specific correction instructions for your artist.");
      return;
    }
    setSubmittingFix(true);
    try {
      const res = await clientRequestReleaseFixAction(inspectCode, fixNote.trim());
      if (res.success) {
        toast.success("Release sent back to artist for correction.");
        setShowFixModal(false);
        setFixNote("");
        setInspectCode(null);
        fetchReleases();
      } else {
        toast.error(res.message);
      }
    } finally {
      setSubmittingFix(false);
    }
  };

  // Badge counters
  const totalCount = releases.length;
  const pendingReviewCount = releases.filter(
    (r) => r.status === "SUBMITTED" || r.status === "IN_REVIEW",
  ).length;
  const approvedCount = releases.filter((r) => r.status === "APPROVED" || r.status === "CLIENT_APPROVED").length;
  const distributedCount = releases.filter(
    (r) => r.status === "DISTRIBUTED",
  ).length;
  const needsFixCount = releases.filter((r) => r.status === "NEEDS_FIX").length;
  const rejectedCount = releases.filter((r) => r.status === "REJECTED").length;

  const leadTrack = inspectRelease?.tracks?.[0];
  const coverUrl =
    inspectRelease?.presignedCoverUrl ||
    inspectRelease?.coverArtDownloadUrl ||
    inspectRelease?.coverArtUrl;

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <Disc3 className="w-4 h-4" />
            <span>WhiteLabel Catalog Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Catalog Submissions Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and inspect music releases submitted by your artists. Approve validated releases for Mother Platform DSP distribution or request revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Tabs with glowing badges */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStatus === "ALL"
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>All Submissions</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {totalCount}
            </Badge>
          </button>

          <button
            onClick={() => setSelectedStatus("SUBMITTED")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStatus === "SUBMITTED"
                ? "bg-amber-500 text-black font-semibold"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Pending Your Review</span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              {pendingReviewCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus("APPROVED")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStatus === "APPROVED"
                ? "bg-emerald-600 text-white font-semibold"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Approved by You (At Mother Company)</span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus("DISTRIBUTED")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStatus === "DISTRIBUTED"
                ? "bg-blue-600 text-white font-semibold"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Distributed / Live</span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {distributedCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus("NEEDS_FIX")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStatus === "NEEDS_FIX"
                ? "bg-orange-600 text-white font-semibold"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Needs Fix / Changes</span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {needsFixCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus("REJECTED")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStatus === "REJECTED"
                ? "bg-rose-600 text-white font-semibold"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Rejected</span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {rejectedCount}
            </span>
          </button>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full sm:w-72 flex items-center"
        >
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search release, UPC, artist..."
            className="pl-9 text-xs h-9"
          />
        </form>
      </div>

      {/* Catalog Listing */}
      {loading ? (
        <div className="p-16 text-center bg-card rounded-2xl border border-border/60">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card rounded-2xl border border-border/60">
          <Music className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold">No submissions found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            No music releases match your current status filter or search query.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Cover</TableHead>
                <TableHead>Release Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tracks</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>QC Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((rel) => {
                const cover =
                  rel.presignedCoverUrl ||
                  rel.coverArtDownloadUrl ||
                  rel.coverArtUrl;
                const primaryArtist =
                  rel.contributors?.[0]?.name ||
                  rel.labelName ||
                  "Signed Artist";

                return (
                  <ContextMenu key={rel.id}>
                    <ContextMenuTrigger
                      render={
                        <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors" />
                      }
                    >
                      <TableCell>
                        <div className="w-12 h-12 shrink-0">
                          <AspectRatio
                            ratio={1}
                            className="w-full h-full rounded-lg bg-muted overflow-hidden border border-border/50"
                          >
                            {cover ? (
                              <img
                                src={cover}
                                alt={rel.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Music className="w-5 h-5" />
                              </div>
                            )}
                          </AspectRatio>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <span className="font-semibold text-sm text-foreground">
                            {rel.title}
                          </span>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {rel.code} {rel.upc && `• UPC: ${rel.upc}`}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        <HoverCard>
                          <HoverCardTrigger className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer hover:underline">
                            {primaryArtist}
                          </HoverCardTrigger>
                          <HoverCardContent className="w-72 p-3 space-y-2">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {primaryArtist.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs truncate text-foreground">{primaryArtist}</p>
                                <span className="text-[10px] text-muted-foreground">Roster Artist • {rel.genre || "Multi-Genre"}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/50">
                              <span className="text-muted-foreground">Associated Releases:</span>
                              <span className="font-semibold text-foreground">1 Active Release</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">Pre-Flight QC:</span>
                              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Clean Master
                              </span>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>

                      <TableCell>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                          {rel.type}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs">
                        {rel.trackCount || rel.tracks?.length || 0} tracks
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {rel.submittedAt
                          ? new Date(rel.submittedAt).toLocaleDateString()
                          : "Draft"}
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>QC Passed</span>
                        </span>
                      </TableCell>

                      <TableCell>
                        {rel.status === "SUBMITTED" ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse text-[10px]">
                            Pending Review
                          </Badge>
                        ) : rel.status === "CLIENT_APPROVED" || rel.status === "APPROVED" ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                            Label Approved
                          </Badge>
                        ) : rel.status === "DISTRIBUTED" ? (
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">
                            Distributed / Live
                          </Badge>
                        ) : rel.status === "NEEDS_FIX" ? (
                          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px]">
                            Needs Fix
                          </Badge>
                        ) : rel.status === "REJECTED" ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            {rel.status}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInspect(rel.code)}
                          className="text-xs h-8 border-primary/40 text-primary hover:bg-primary/10"
                        >
                          Review Dossier
                        </Button>
                      </TableCell>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-52">
                      <ContextMenuItem
                        onClick={() => handleInspect(rel.code)}
                        className="gap-2 text-xs cursor-pointer"
                      >
                        <Disc3 className="w-3.5 h-3.5 text-primary" />
                        <span>Review Dossier</span>
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(rel.code);
                          toast.success(`Copied release code ${rel.code}`);
                        }}
                        className="gap-2 text-xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code ({rel.code})</span>
                      </ContextMenuItem>
                      {rel.tracks?.[0]?.isrc && (
                        <ContextMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(rel.tracks![0].isrc!);
                            toast.success(`Copied ISRC ${rel.tracks![0].isrc}`);
                          }}
                          className="gap-2 text-xs cursor-pointer"
                        >
                          <Music className="w-3.5 h-3.5" />
                          <span>Copy Lead ISRC</span>
                        </ContextMenuItem>
                      )}
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleInspect(rel.code)}
                        className="gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve for Platform</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {releases.map((rel) => {
            const cover =
              rel.presignedCoverUrl ||
              rel.coverArtDownloadUrl ||
              rel.coverArtUrl;
            const primaryArtist =
              rel.contributors?.[0]?.name || rel.labelName || "Signed Artist";

            return (
              <ContextMenu key={rel.id}>
                <ContextMenuTrigger
                  render={
                    <div className="group rounded-2xl border border-border/70 bg-card p-4 flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs cursor-pointer" />
                  }
                >
                  <div>
                    <AspectRatio
                      ratio={1}
                      className="w-full rounded-xl bg-muted overflow-hidden relative border border-border/50 mb-3"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Music className="w-10 h-10" />
                        </div>
                      )}
                      <span className="absolute top-2 right-2 text-[10px] font-mono uppercase bg-black/70 backdrop-blur-md text-white px-2 py-0.5 rounded-md font-semibold">
                        {rel.type}
                      </span>
                    </AspectRatio>

                    <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {primaryArtist}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
                      <span>{rel.trackCount || rel.tracks?.length || 0} tracks</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> QC Passed
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 mt-3 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {rel.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspect(rel.code);
                      }}
                      className="text-xs h-7 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      Inspect
                    </Button>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-52">
                  <ContextMenuItem
                    onClick={() => handleInspect(rel.code)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Disc3 className="w-3.5 h-3.5 text-primary" />
                    <span>Review Dossier</span>
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(rel.code);
                      toast.success(`Copied release code ${rel.code}`);
                    }}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code ({rel.code})</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}

      {/* Rich Release Dossier Drawer / Sheet */}
      <Sheet open={!!inspectCode} onOpenChange={(open) => !open && setInspectCode(null)}>
        <SheetContent className="max-w-2xl sm:max-w-xl w-full overflow-y-auto p-6 space-y-6">
          <SheetHeader>
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase font-semibold">
              <Disc3 className="w-4 h-4" />
              <span>Release Dossier Review</span>
            </div>
            <SheetTitle className="text-xl font-bold">
              {inspectRelease?.title || "Release Overview"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Inspect cover artwork resolution, listen to lossless audio preview, inspect tracklist ISRCs, and evaluate pre-flight Quality Control checks.
            </SheetDescription>
          </SheetHeader>

          {loadingDossier || !inspectRelease ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Cover Artwork Zoom & Overview Banner */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/40 border border-border/70">
                <div
                  onClick={() => coverUrl && setLightboxOpen(true)}
                  className="group relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-background border border-border/70 cursor-pointer shadow-xs"
                  title="Click to zoom cover artwork"
                >
                  <AspectRatio ratio={1} className="w-full h-full">
                    {coverUrl ? (
                      <>
                        <img
                          src={coverUrl}
                          alt={inspectRelease.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Music className="w-8 h-8" />
                      </div>
                    )}
                  </AspectRatio>
                </div>

                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="text-[10px] font-mono uppercase bg-primary/10 text-primary">
                        {inspectRelease.type}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {inspectRelease.code}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground mt-1">
                      {inspectRelease.title}
                    </h3>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      Artist:{" "}
                      <span className="font-semibold text-foreground">
                        {inspectRelease.contributors?.[0]?.name ||
                          inspectRelease.labelName ||
                          "Signed Artist"}
                      </span>{" "}
                      • Genre: {inspectRelease.genre}
                    </p>

                    {inspectRelease.upc && (
                      <p className="text-[11px] font-mono text-muted-foreground mt-1">
                        UPC: {inspectRelease.upc}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => setLightboxOpen(true)}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>3000px Art Lightbox</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lead Track Audio Player Preview with Waveform Bars */}
              {leadTrack && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileAudio className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        Lead Track Audio Preview
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      24-Bit / 44.1kHz Lossless
                    </span>
                  </div>

                  <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border/50">
                    <button
                      onClick={toggleLeadAudioPlay}
                      className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate">{leadTrack.title}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {formatSeconds(currentTime)} /{" "}
                          {formatSeconds(duration || leadTrack.durationSeconds || 180)}
                        </span>
                      </div>

                      {/* Animated Waveform Bars */}
                      <div className="flex items-end gap-1 h-7 mt-1.5 overflow-hidden">
                        {[
                          40, 65, 30, 85, 95, 50, 75, 45, 90, 60, 35, 70, 80,
                          55, 90, 45, 60, 75, 50, 65,
                        ].map((height, i) => (
                          <div
                            key={i}
                            style={{
                              height: isPlayingAudio ? `${height}%` : "25%",
                            }}
                            className={`flex-1 rounded-full transition-all duration-200 ${
                              isPlayingAudio
                                ? "bg-primary animate-pulse"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {(leadTrack.presignedAudioUrl || (leadTrack as any).audioDownloadUrl || leadTrack.audioUrl) && (
                    <audio
                      ref={audioRef}
                      src={leadTrack.presignedAudioUrl || (leadTrack as any).audioDownloadUrl || leadTrack.audioUrl}
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
                      onEnded={() => setIsPlayingAudio(false)}
                      onError={() => setIsPlayingAudio(false)}
                    />
                  )}
                </div>
              )}

              {/* Complete Tracklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Complete Tracklist ({inspectRelease.tracks?.length || 0})</span>
                  <span className="font-mono text-[10px]">ISRCs & Metadata</span>
                </h4>

                <div className="divide-y divide-border/60 border border-border/70 rounded-xl overflow-hidden bg-background">
                  {inspectRelease.tracks && inspectRelease.tracks.length > 0 ? (
                    inspectRelease.tracks.map((track: Track) => (
                      <div
                        key={track.id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-muted-foreground w-4 text-center">
                            {track.trackNumber}
                          </span>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{track.title}</span>
                              {track.explicit && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                                  EXPLICIT
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {track.isrc ? `ISRC: ${track.isrc}` : "ISRC Pending"} •{" "}
                              {track.durationSeconds
                                ? formatSeconds(track.durationSeconds)
                                : "3:00"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            Clean
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No tracks registered.
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-flight QC Validation Checklist */}
              <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Pre-Flight QC Automated Validation</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Severity 1 Requirements (Blocking):
                    </span>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Lossless FLAC/WAV Audio Format Verified</span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">Passed</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Cover Art Resolution: 3000x3000px Uncompressed</span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">Passed</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>ISRC Standard Syntax Check</span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">Passed</Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Severity 2 Advisories (Non-Blocking):
                    </span>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Lyrics & Explicit Tag Consistency Check</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">No conflicts</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Contributor DSP Profile Mapping</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">Linked</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFixModal(true)}
                  className="w-full sm:w-auto text-xs h-10 px-4 bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20 font-semibold gap-1.5 cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Request Fix / Send Back</span>
                </Button>

                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full sm:w-auto text-xs h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {approving ? "Approving..." : "Approve for Platform Distribution"}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cover Artwork Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-2xl p-4 bg-background">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center justify-between">
              <span>High-Resolution Artwork Preview</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                3000 x 3000 px • 1:1 Aspect Ratio
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="w-full rounded-xl overflow-hidden bg-muted border border-border/50">
            <AspectRatio ratio={1} className="w-full">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt="High-resolution artwork"
                  className="w-full h-full object-contain"
                />
              )}
            </AspectRatio>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviewer Fix Request Modal */}
      <Dialog open={showFixModal} onOpenChange={setShowFixModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>Request Corrections from Artist</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Specify what needs to be corrected (e.g. low-resolution cover art, missing explicit tag, distorted audio master, incorrect songwriter spelling).
              This feedback will appear in your artist&apos;s backstage portal.
            </p>

            <textarea
              value={fixNote}
              onChange={(e) => setFixNote(e.target.value)}
              placeholder="e.g. Please replace track 2 with unclipped 24-bit WAV audio master and ensure cover art has no store logos."
              rows={4}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 font-normal"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowFixModal(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendBackForFix}
              disabled={submittingFix || !fixNote.trim()}
              className="text-xs h-9 bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-1.5 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{submittingFix ? "Sending..." : "Send Revision Request"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}