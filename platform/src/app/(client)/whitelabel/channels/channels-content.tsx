"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { VevoChannel } from "@/types/distribution";
import {
  clientGetVevoChannelsAction,
  clientApproveVevoChannelAction,
  clientRejectVevoChannelAction,
} from "@/actions/client/catalog/client-catalog.action";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Radio,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export function ClientChannelsContent() {
  const [channels, setChannels] = useState<VevoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Reject Modal State
  const [rejectCode, setRejectCode] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);
  const [approvingCode, setApprovingCode] = useState<string | null>(null);

  const fetchChannels = () => {
    startTransition(async () => {
      setLoading(true);
      const res = await clientGetVevoChannelsAction();
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

  const handleApprove = async (code: string) => {
    setApprovingCode(code);
    try {
      const res = await clientApproveVevoChannelAction(code);
      if (res.success) {
        toast.success(res.message);
        fetchChannels();
      } else {
        toast.error(res.message);
      }
    } finally {
      setApprovingCode(null);
    }
  };

  const handleReject = async () => {
    if (!rejectCode || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await clientRejectVevoChannelAction(rejectCode, rejectReason.trim());
      if (res.success) {
        toast.success(res.message);
        setRejectCode(null);
        setRejectReason("");
        fetchChannels();
      } else {
        toast.error(res.message);
      }
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs tracking-wider uppercase mb-1">
          <Play className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span>Official Artist VEVO Channels</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          VEVO Channel Requests Review
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve official YouTube VEVO channel requests submitted by your artists. Approved requests are forwarded to Mother Company for direct upstream YouTube/VEVO network provisioning.
        </p>
      </div>

      {/* Guidelines Card */}
      <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Official VEVO YouTube Channel Policy
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Channels must follow the standard <span className="font-mono text-foreground font-semibold">[ArtistName]VEVO</span> naming convention.
              Artists must provide at least 1 upcoming high-definition music video (1080p/4K) and channel branding banner (2048x1152px).
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-16 text-center bg-card rounded-2xl border border-border/60">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card rounded-2xl border border-border/60">
          <Radio className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold">No VEVO channel requests</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            When artists under your WhiteLabel request official VEVO channels, they will appear here for your review and approval.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel Name</TableHead>
                <TableHead>Artist Name</TableHead>
                <TableHead>Request Code</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>YouTube Live Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((chan) => (
                <TableRow key={chan.id}>
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                      <span>{chan.channelName}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-medium">
                    {chan.artistName || chan.channelName}
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {chan.code}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {chan.createdAt
                      ? new Date(chan.createdAt).toLocaleDateString()
                      : "Recently"}
                  </TableCell>

                  <TableCell>
                    {chan.status === "REQUESTED" || chan.status === "PENDING" ? (
                      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse text-[10px]">
                        Pending Review
                      </Badge>
                    ) : chan.status === "CLIENT_APPROVED" ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        Approved (At Mother Co.)
                      </Badge>
                    ) : chan.status === "APPROVED" ? (
                      <Badge className="bg-emerald-500 text-white text-[10px]">
                        Live on VEVO
                      </Badge>
                    ) : chan.status === "REJECTED" ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        {chan.status}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {chan.channelUrl ? (
                      <a
                        href={chan.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Open Channel</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">
                        Not provisioned
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {chan.status === "REQUESTED" || chan.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejectCode(chan.code)}
                            className="text-xs h-8 text-rose-500 hover:bg-rose-500/10"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(chan.code)}
                            disabled={approvingCode === chan.code}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {approvingCode === chan.code
                                ? "Approving..."
                                : "Approve Channel"}
                            </span>
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
                          {chan.status === "APPROVED" ? "Provisioned" : "Processed"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={!!rejectCode} onOpenChange={(open) => !open && setRejectCode(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Reject VEVO Channel Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide feedback why this VEVO channel request cannot be approved (e.g. invalid name format, missing banner art).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Channel name does not meet VEVO guidelines or artist does not have planned music video release."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setRejectCode(null)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submittingReject || !rejectReason.trim()}
              className="text-xs h-9 font-semibold gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{submittingReject ? "Rejecting..." : "Reject Request"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
