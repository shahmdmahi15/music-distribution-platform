"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getVevoChannelsAction,
  requestVevoChannelAction,
} from "@/actions/catalog/whitelabel-catalog.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Radio,
  Plus,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

export function ChannelsContent() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [channelName, setChannelName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [description, setDescription] = useState("");

  const loadChannels = async () => {
    setLoading(true);
    const res = await getVevoChannelsAction();
    if (res.success) {
      setChannels(res.channels);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleRequestChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) {
      toast.error("Please enter a channel name (e.g. ArtistNameVEVO).");
      return;
    }

    setSubmitting(true);
    const res = await requestVevoChannelAction({
      channelName: channelName.trim(),
      artistName: artistName.trim() || undefined,
      description: description.trim() || undefined,
    });

    if (res.success) {
      toast.success(res.message);
      setShowModal(false);
      setChannelName("");
      setArtistName("");
      setDescription("");
      loadChannels();
    } else {
      toast.error(res.message);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved (Live)</span>
          </Badge>
        );
      case "SUBMITTED":
      case "PENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            <span>Pending VEVO Review</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            <span>Rejected</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500" />
            <span>VEVO Channels</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request and manage official VEVO YouTube channels for your roster artists.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Request New VEVO Channel</span>
        </Button>
      </div>

      {/* Channels Table Card */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading channels...</span>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
            <Radio className="w-10 h-10 opacity-30" />
            <h3 className="text-base font-semibold text-foreground">No VEVO Channels Yet</h3>
            <p className="text-xs max-w-sm">
              You haven't requested any VEVO channels. Request an official channel to distribute music videos directly to VEVO and YouTube.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowModal(true)}
              className="mt-2"
            >
              Request First Channel
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Channel Handle</TableHead>
                <TableHead>Primary Artist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>YouTube Destination</TableHead>
                <TableHead>Requested Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((chan) => (
                <TableRow key={chan.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {chan.code}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {chan.channelName}
                  </TableCell>
                  <TableCell className="text-sm">
                    {chan.artistName || "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(chan.status)}</TableCell>
                  <TableCell>
                    {chan.channelUrl ? (
                      <a
                        href={chan.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Visit Channel</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Allocating upon approval
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(chan.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-base">Request Official VEVO Channel</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestChannel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channelName">Channel Name (Handle) *</Label>
                <Input
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. LunaEclipseVEVO"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Standard format is ArtistNameVEVO (no spaces or special characters).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="artistName">Primary Artist Name *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g. Luna Eclipse"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Artist Biography / Notes (Optional)</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Official music video channel notes..."
                  className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting Request..." : "Submit to VEVO"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
