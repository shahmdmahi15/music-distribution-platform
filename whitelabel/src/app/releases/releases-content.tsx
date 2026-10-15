"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Release, ReleaseStatus } from "@/types/catalog";
import { wlGetReleasesAction } from "@/actions/catalog/whitelabel-catalog.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Plus,
  Search,
  Disc3,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export function ReleasesContent() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const fetchReleases = () => {
    startTransition(async () => {
      setLoading(true);
      const res = await wlGetReleasesAction({
        search: search.trim() || undefined,
        status:
          selectedStatus === "ALL"
            ? undefined
            : (selectedStatus as ReleaseStatus),
        limit: 50,
      });
      if (res.success) {
        setReleases(res.data);
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
        return <Badge variant="destructive">Needs Action</Badge>;
      case "TAKEDOWN":
        return <Badge variant="outline" className="text-zinc-500">Takedown</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusFilters = [
    { label: "All Releases", value: "ALL" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Distributed", value: "DISTRIBUTED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
            <Music className="w-4 h-4" />
            <span>Catalog Distribution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Music Releases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your singles, EPs, and albums. Releases submitted here are delivered to Mother Company for DSP distribution.
          </p>
        </div>

        <Button
          render={
            <Link href="/releases/new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Release</span>
            </Link>
          }
          size="default"
          className="shadow-md"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/60">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedStatus(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === f.value
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
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
            placeholder="Search title, UPC, code..."
            className="pl-9 text-xs h-9"
          />
        </form>
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
          <Button
            render={
              <Link href="/releases/new" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Create First Release</span>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {releases.map((rel) => (
            <Link
              key={rel.id}
              href={`/releases/${rel.code}`}
              className="group flex flex-col bg-card rounded-xl border border-border/60 hover:border-primary/50 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-lg"
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
                <div className="absolute top-2.5 right-2.5">
                  {getStatusBadge(rel.status)}
                </div>
                <div className="absolute bottom-2 left-2.5">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs">
                    {rel.type}
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {rel.title}
                  </h3>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {rel.contributors && rel.contributors.length > 0
                      ? rel.contributors.map((c) => c.name).join(", ")
                      : rel.labelName || "Various Artists"}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{rel.trackCount || 0} {rel.trackCount === 1 ? 'track' : 'tracks'}</span>
                  </div>

                  <div className="flex items-center gap-1 text-primary text-xs font-medium">
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
