"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { VevoChannel, VevoChannelStatus } from "@/types/distribution";
import {
  adminGetVevoChannelsAction,
  adminDispatchAnsVevoChannelAction,
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
  Tv,
  Search,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  RefreshCw,
  Sparkles,
  Play,
} from "lucide-react";

export function AdminChannelsContent() {
  const [channels, setChannels] = useState<VevoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dispatchingCode, setDispatchingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchChannels = () => {
    startTransition(async () => {
      setLoading(true);
      const res = await adminGetVevoChannelsAction();
      if (res.success) {
        setChannels(res.channels);
      } else {
        toast.error(res.message);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleDispatch = async (code: string) => {
    setDispatchingCode(code);
    try {
      const res = await adminDispatchAnsVevoChannelAction(code);
      if (res.success) {
        toast.success("VEVO channel request dispatched to ANS Music upstream!");
        fetchChannels();
      } else {
        toast.error(res.message || "Failed to dispatch channel request");
      }
    } catch (err: any) {
      toast.error(err.message || "Dispatch error");
    } finally {
      setDispatchingCode(null);
    }
  };

  const getStatusBadge = (status: VevoChannelStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 gap-1 text-xs">
            <Clock className="w-3 h-3" />
            Pending Review
          </Badge>
        );
      case "REQUESTED":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 gap-1 text-xs">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Dispatched to ANS
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 gap-1 text-xs">
            <CheckCircle2 className="w-3 h-3" />
            Live on VEVO
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredChannels = channels.filter((c) => {
    if (selectedStatus !== "ALL" && c.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const artistMatch = c.artistName?.toLowerCase().includes(q);
      const channelMatch = c.vevoChannelName?.toLowerCase().includes(q);
      const tenantMatch = c.whiteLabel?.name?.toLowerCase().includes(q);
      const codeMatch = c.code?.toLowerCase().includes(q);
      return artistMatch || channelMatch || tenantMatch || codeMatch;
    }
    return true;
  });

  const totalCount = channels.length;
  const approvedCount = channels.filter((c) => c.status === "APPROVED").length;
  const pendingCount = channels.filter((c) => c.status === "PENDING").length;
  const requestedCount = channels.filter((c) => c.status === "REQUESTED").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
          <Tv className="w-4 h-4" />
          <span>VEVO Video Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          VEVO YouTube Channels Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, manage, and dispatch official artist VEVO YouTube channel creation requests across all WhiteLabel tenants to ANS Music.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs">
          <span className="text-xs font-mono text-muted-foreground uppercase">Total Channels</span>
          <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <span className="text-xs font-mono text-emerald-500 uppercase">Live on VEVO</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 shadow-xs">
          <span className="text-xs font-mono text-blue-400 uppercase">Dispatched (Upstream)</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{requestedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-xs">
          <span className="text-xs font-mono text-amber-400 uppercase">Pending Review</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { label: "All Channels", value: "ALL" },
            { label: "Pending", value: "PENDING" },
            { label: "Dispatched", value: "REQUESTED" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ].map((tab) => (
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

        <div className="relative w-full sm:w-72 flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artist, channel, tenant..."
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Channels Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Tv className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No VEVO channels found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              No WhiteLabel artist VEVO channels match your current search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artist & VEVO Channel</TableHead>
                  <TableHead>WhiteLabel Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upstream Channel ID</TableHead>
                  <TableHead>YouTube Link</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <span>{c.vevoChannelName}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({c.code})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-foreground">Artist: {c.artistName}</span>
                        </div>
                        {c.rejectionReason && (
                          <div className="text-[11px] text-destructive mt-1 font-medium">
                            Note: {c.rejectionReason}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                          {c.whiteLabel?.name || "Independent"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(c.status)}</TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.upstreamChannelId || "—"}
                    </TableCell>

                    <TableCell>
                      {c.youtubeChannelUrl ? (
                        <a
                          href={c.youtubeChannelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline font-semibold"
                        >
                          <Play className="w-3.5 h-3.5 fill-red-500" />
                          <span>View Channel</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="text-right">
                      {c.status !== "APPROVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dispatchingCode === c.code}
                          onClick={() => handleDispatch(c.code)}
                          className="text-xs h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {dispatchingCode === c.code ? "Dispatching..." : "Dispatch to ANS"}
                          </span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
