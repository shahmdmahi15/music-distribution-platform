"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Release, ReleaseStatus } from "@/types/catalog";
import {
  wlGetReleasesAction,
  wlGetAudioStreamUrlAction,
} from "@/actions/catalog/whitelabel-catalog.action";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Music,
  Plus,
  Search,
  Disc3,
  Layers,
  ChevronRight,
  Play,
  Pause,
  LayoutGrid,
  List,
  Volume2,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function ReleasesContent() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [allReleasesCache, setAllReleasesCache] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(releases.length / pageSize));
  const paginatedReleases = releases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const [isPending, startTransition] = useTransition();

  // Inline Audio Preview Player State
  const [activeTrackPlaying, setActiveTrackPlaying] = useState<string | null>(null);
  const [playingTrackTitle, setPlayingTrackTitle] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load view mode from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("catalog_view_mode");
      if (savedMode === "grid" || savedMode === "table") {
        setViewMode(savedMode);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem("catalog_view_mode", mode);
    } catch {
      // ignore
    }
  };

  const fetchReleases = () => {
    startTransition(async () => {
      setLoading(true);
      const res = await wlGetReleasesAction({
        search: search.trim() || undefined,
        status:
          selectedStatus === "ALL"
            ? undefined
            : (selectedStatus as ReleaseStatus),
        limit: 100,
      });
      if (res.success) {
        setReleases(res.data);
        setCurrentPage(1);
        if (selectedStatus === "ALL" && !search) {
          setAllReleasesCache(res.data);
        }
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

  // Inline Audio Play / Pause
  const handleToggleAudio = async (rel: Release, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const track = rel.tracks?.[0];
    const trackCode = track?.code || rel.code;

    if (activeTrackPlaying === trackCode) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
      return;
    }

    try {
      toast.info(`Loading lossless preview for ${rel.title}...`);
      const streamRes = await wlGetAudioStreamUrlAction(trackCode);
      if (streamRes.success && streamRes.streamUrl) {
        setAudioUrl(streamRes.streamUrl);
        setActiveTrackPlaying(trackCode);
        setPlayingTrackTitle(`${rel.title} - ${track?.title || "Lead Master"}`);
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.src = streamRes.streamUrl;
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      } else {
        toast.error("Audio stream is currently being transcoded or unavailable.");
      }
    } catch (err: any) {
      toast.error("Playback error: " + err.message);
    }
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
            Submitted
          </Badge>
        );
      case "IN_REVIEW":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
            In Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Approved
          </Badge>
        );
      case "DISTRIBUTED":
        return (
          <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
            Distributed
          </Badge>
        );
      case "REJECTED":
      case "NEEDS_FIX":
        return <Badge variant="destructive">Needs Action</Badge>;
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

  // Dynamic status tab counts from cache
  const baseList = allReleasesCache.length > 0 ? allReleasesCache : releases;
  const countAll = baseList.length;
  const countDrafts = baseList.filter((r) => r.status === "DRAFT").length;
  const countInReview = baseList.filter(
    (r) => r.status === "IN_REVIEW" || r.status === "SUBMITTED",
  ).length;
  const countDistributed = baseList.filter(
    (r) => r.status === "DISTRIBUTED" || r.status === "APPROVED",
  ).length;
  const countRejected = baseList.filter(
    (r) => r.status === "REJECTED" || r.status === "NEEDS_FIX",
  ).length;

  const statusFilters = [
    { label: "All Releases", value: "ALL", count: countAll },
    { label: "Drafts", value: "DRAFT", count: countDrafts },
    { label: "In Review", value: "IN_REVIEW", count: countInReview },
    { label: "Distributed", value: "DISTRIBUTED", count: countDistributed },
    { label: "Rejected / Needs Action", value: "REJECTED", count: countRejected },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Hidden Audio Player Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current && audioRef.current.duration) {
            setAudioProgress(
              (audioRef.current.currentTime / audioRef.current.duration) * 100,
            );
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setActiveTrackPlaying(null);
          setAudioProgress(0);
        }}
        onError={() => {
          setIsPlaying(false);
          setActiveTrackPlaying(null);
        }}
      />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
            <Music className="w-4 h-4" />
            <span>Catalog Distribution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Music Releases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your singles, EPs, and albums. Releases submitted here are delivered to Mother Company for DSP distribution.
          </p>
        </div>

        <Link href="/releases/new">
          <Button size="default" className="shadow-md gap-2 font-semibold">
            <Plus className="w-4 h-4" />
            <span>+ Create Release</span>
          </Button>
        </Link>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card p-4 rounded-xl border border-border/70 shadow-xs">
        {/* Segmented Status Tabs with Dynamic Pill Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedStatus(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                selectedStatus === f.value
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedStatus === f.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full sm:w-64 flex items-center"
          >
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, UPC, code..."
              className="pl-9 text-xs h-9"
            />
          </form>

          {/* Dual View Switcher (Grid vs Table) */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shrink-0">
            <button
              onClick={() => handleToggleViewMode("grid")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visual Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggleViewMode("table")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Dense Data Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Release List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl bg-card/50 border border-border/40 animate-pulse"
            />
          ))}
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border/80 rounded-2xl bg-card/30">
          <Disc3 className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3 animate-spin-slow" />
          <h3 className="text-lg font-semibold">No releases found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
            {search
              ? "No releases matched your search query. Try searching with different keywords."
              : "You haven't created any music releases in this catalog yet. Get started by uploading your first track!"}
          </p>
          <Link href="/releases/new">
            <Button className="gap-2 font-semibold">
              <Plus className="w-4 h-4" />
              <span>Create First Release</span>
            </Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* VISUAL GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paginatedReleases.map((rel) => {
            const isThisPlaying =
              activeTrackPlaying === (rel.tracks?.[0]?.code || rel.code) &&
              isPlaying;

            return (
              <div
                key={rel.id}
                className="group flex flex-col bg-card rounded-xl border border-border/60 hover:border-primary/50 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-lg relative"
              >
                {/* Artwork Box */}
                <div className="relative aspect-square w-full bg-muted/40 overflow-hidden">
                  {rel.presignedCoverUrl || rel.coverArtUrl ? (
                    <img
                      src={rel.presignedCoverUrl || rel.coverArtUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 bg-zinc-900/50">
                      <Music className="w-12 h-12 mb-2" />
                      <span className="text-xs">No Artwork</span>
                    </div>
                  )}

                  {/* Inline Audio Preview Play Button Overlay */}
                  <button
                    onClick={(e) => handleToggleAudio(rel, e)}
                    className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer ${
                      isThisPlaying
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : "bg-black/75 text-white backdrop-blur-xs hover:bg-primary"
                    }`}
                    title={isThisPlaying ? "Pause Preview" : "Play Lossless Audio Preview"}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <div className="absolute top-2.5 right-2.5">
                    {getStatusBadge(rel.status)}
                  </div>
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs font-mono">
                      {rel.type}
                    </span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <Link href={`/releases/${rel.code}`} className="block">
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {rel.title}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {rel.contributors && rel.contributors.length > 0
                        ? rel.contributors.map((c) => c.name).join(", ")
                        : rel.labelName || "Various Artists"}
                    </div>
                  </Link>

                  <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        {rel.trackCount || 1}{" "}
                        {rel.trackCount === 1 ? "track" : "tracks"}
                      </span>
                    </div>

                    <Link
                      href={`/releases/${rel.code}`}
                      className="flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DENSE DATA TABLE VIEW */
        <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Release Title & Artist</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">UPC / Code</TableHead>
                <TableHead className="hidden lg:table-cell">Tracks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReleases.map((rel) => {
                const isThisPlaying =
                  activeTrackPlaying === (rel.tracks?.[0]?.code || rel.code) &&
                  isPlaying;

                return (
                  <TableRow key={rel.id} className="hover:bg-muted/30">
                    <TableCell className="p-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted/60 border border-border/60 shrink-0 group">
                        {rel.presignedCoverUrl || rel.coverArtUrl ? (
                          <img
                            src={rel.presignedCoverUrl || rel.coverArtUrl}
                            alt={rel.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleToggleAudio(rel, e)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          title="Play Lead Master"
                        >
                          {isThisPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="min-w-0">
                        <Link
                          href={`/releases/${rel.code}`}
                          className="font-semibold text-xs text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {rel.title}
                        </Link>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {rel.contributors && rel.contributors.length > 0
                            ? rel.contributors.map((c) => c.name).join(", ")
                            : rel.labelName || "Various Artists"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-3">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-muted font-medium">
                        {rel.type}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-3 text-xs font-mono text-muted-foreground">
                      {rel.upc || rel.code}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-3 text-xs text-muted-foreground">
                      {rel.trackCount || 1} {rel.trackCount === 1 ? "track" : "tracks"}
                    </TableCell>
                    <TableCell className="p-3">
                      {getStatusBadge(rel.status)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-3 text-xs text-muted-foreground">
                      {rel.releaseDate
                        ? new Date(rel.releaseDate).toLocaleDateString()
                        : "Immediate"}
                    </TableCell>
                    <TableCell className="text-right p-3">
                      <Link href={`/releases/${rel.code}`}>
                        <Button size="xs" variant="outline" className="text-[11px] h-7">
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    isActive={currentPage === idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    className="cursor-pointer"
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Sticky Bottom Mini Lossless Audio Preview Bar */}
      {activeTrackPlaying && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50 p-3.5 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (audioRef.current) {
                  if (audioRef.current.paused) {
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  } else {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  }
                }
              }}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground truncate">
                  {playingTrackTitle}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                  Lossless Audio
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-48 rounded-full bg-muted mt-1 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              setIsPlaying(false);
              setActiveTrackPlaying(null);
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
