"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  getVevoChannelsAction,
  requestVevoChannelAction,
} from "@/actions/catalog/whitelabel-catalog.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
  Radio,
  Plus,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  ShieldCheck,
  Image as ImageIcon,
  Film,
  Info,
  Check,
  Share2,
} from "lucide-react";

function Youtube({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function ChannelsContent() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [artistName, setArtistName] = useState("");
  const [customHandle, setCustomHandle] = useState("");
  const [description, setDescription] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Generate clean VEVO handle automatically from Artist Name if custom handle is untouched
  const generatedHandle = useMemo(() => {
    if (customHandle.trim()) {
      return customHandle.trim().replace(/[^a-zA-Z0-9]/g, "");
    }
    const cleanArtist = artistName.trim().replace(/[^a-zA-Z0-9]/g, "");
    return cleanArtist ? `${cleanArtist}VEVO` : "";
  }, [artistName, customHandle]);

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
    if (!artistName.trim()) {
      toast.error("Please enter the primary artist name.");
      return;
    }

    if (!generatedHandle.trim()) {
      toast.error("Please enter a valid channel handle (e.g. ArtistNameVEVO).");
      return;
    }

    if (!agreedToTerms) {
      toast.error("You must acknowledge and agree to VEVO's distribution guidelines.");
      return;
    }

    setSubmitting(true);
    const res = await requestVevoChannelAction({
      channelName: generatedHandle.trim(),
      artistName: artistName.trim(),
      description: description.trim() || undefined,
    });

    if (res.success) {
      toast.success(res.message);
      setShowModal(false);
      setArtistName("");
      setCustomHandle("");
      setDescription("");
      setSpotifyUrl("");
      setInstagramUrl("");
      setAgreedToTerms(false);
      loadChannels();
    } else {
      toast.error(res.message);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "APPROVED":
      case "LIVE":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold">APPROVED (Live on VEVO)</span>
          </Badge>
        );
      case "CLIENT_APPROVED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-semibold">Label Approved (At Mother Co.)</span>
          </Badge>
        );
      case "DISPATCHED_TO_ANS":
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span className="font-semibold">Dispatched to VEVO (ANS)</span>
          </Badge>
        );
      case "SUBMITTED":
      case "PENDING":
      case "REQUESTED":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span className="font-semibold">REQUESTED (In Review)</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
              <AlertTriangle className="w-3 h-3" />
              <span>REJECTED</span>
            </Badge>
            <span
              title="Artwork or naming format did not meet VEVO specifications. Review rules and re-submit."
              className="text-xs text-muted-foreground cursor-help"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-500 mb-1">
            <Youtube className="w-4 h-4" />
            <span>Official Video Distribution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-red-500" />
            <span>VEVO YouTube Channels</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Provision, manage, and verify Official VEVO YouTube Partner Channels for your signed artist roster with direct YouTube Content ID monetization.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 shadow-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Request New VEVO Channel</span>
        </Button>
      </div>

      {/* 4-Stage VEVO Channel Lifecycle Stepper */}
      <Card className="border border-border/70 shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border/50">
          <CardTitle className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            VEVO Channel Allocation Lifecycle
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { step: 1, name: "Requested", desc: "Artist Channel Application" },
              { step: 2, name: "Label Approved", desc: "WhiteLabel Owner Sign-off" },
              { step: 3, name: "Dispatched to VEVO", desc: "ANS Music Direct Pipeline" },
              { step: 4, name: "Live on YouTube", desc: "Official Artist Badge & VEVO Hub" },
            ].map((s) => (
              <div key={s.step} className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>{s.step}. {s.name}</span>
                  <Radio className="w-3.5 h-3.5 text-red-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Official VEVO YouTube Channel Rules & Guidelines Card */}
      <Card className="border border-red-500/20 bg-gradient-to-br from-red-500/5 via-card to-card shadow-xs">
        <CardHeader className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              <CardTitle className="text-sm font-semibold">Official VEVO Channel Provisioning Rules &amp; Standards</CardTitle>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono text-red-500 border-red-500/30 bg-red-500/10">
              VEVO Operations Spec 2026
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rule 1 */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-card/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Naming Format</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Strictly <span className="font-mono text-foreground font-semibold">[ArtistName]VEVO</span> (e.g. <code className="text-red-500">LunaEclipseVEVO</code>). No spaces, hyphens, or emojis.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-card/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Content Minimum</span>
              </div>
              <p className="text-xs text-muted-foreground">
                At least <strong className="text-foreground">1 official master music video</strong> ready for distribution upon channel allocation.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-card/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Banner Artwork</span>
              </div>
              <p className="text-xs text-muted-foreground">
                High-resolution <strong className="text-foreground">2048 x 1152 px</strong> (safe text zone <code className="text-[11px]">1232x338 px</code> centered for desktop & mobile).
              </p>
            </div>

            {/* Rule 4 */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-card/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-[11px] font-bold">4</span>
                <span>Avatar Icon</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Square <strong className="text-foreground">800 x 800 px</strong> high-res artist portrait. JPG or PNG under 4MB, no text watermarks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channels Table Card */}
      <Card className="rounded-2xl border border-border/60 overflow-hidden shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Provisioned Artist Channels</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">Status and YouTube link destinations for requested VEVO handles.</CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {channels.length} {channels.length === 1 ? "Channel" : "Channels"}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-red-500 mb-2" />
              <span className="text-xs font-medium">Fetching VEVO channel statuses...</span>
            </div>
          ) : channels.length === 0 ? (
            <div className="p-8">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Youtube className="w-6 h-6 text-red-500" />
                  </EmptyMedia>
                  <EmptyTitle>No VEVO Channels Requested Yet</EmptyTitle>
                  <EmptyDescription>
                    Request an official VEVO YouTube channel for your signed roster artists to unlock official artist badges, high CPM video monetization, and VEVO network curation.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => setShowModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Request First Channel</span>
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="text-xs">Channel Code</TableHead>
                  <TableHead className="text-xs">Channel Handle</TableHead>
                  <TableHead className="text-xs">Primary Artist</TableHead>
                  <TableHead className="text-xs">Verification Status</TableHead>
                  <TableHead className="text-xs">YouTube Destination</TableHead>
                  <TableHead className="text-xs">Submission Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((chan) => {
                  const cleanHandle = chan.channelName?.replace(/^@/, "");
                  const youtubeUrl = chan.channelUrl || (cleanHandle ? `https://youtube.com/@${cleanHandle}` : null);
                  const isApproved = (chan.status || "").toUpperCase() === "APPROVED" || (chan.status || "").toUpperCase() === "LIVE";

                  return (
                    <TableRow key={chan.id || chan.code} className="border-border/50 text-xs">
                      <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                        {chan.code || "VEVO-CH"}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                          <span>@{cleanHandle}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {chan.artistName || "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(chan.status)}</TableCell>
                      <TableCell>
                        {isApproved && youtubeUrl ? (
                          <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-semibold underline underline-offset-2"
                          >
                            <span>youtube.com/@{cleanHandle}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Allocated upon VEVO review</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {chan.createdAt ? new Date(chan.createdAt).toLocaleDateString() : "Recent"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Request Channel Dialog Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-bold text-base text-foreground">Request Official VEVO Channel</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">Submit metadata for VEVO network verification.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

            <form onSubmit={handleRequestChannel} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="artistName" className="text-xs font-semibold">Primary Artist Name *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g. Luna Eclipse"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customHandle" className="text-xs font-semibold">
                  Channel Handle (Defaults to [ArtistName]VEVO) *
                </Label>
                <Input
                  id="customHandle"
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  placeholder={artistName ? `${artistName.replace(/[^a-zA-Z0-9]/g, "")}VEVO` : "e.g. LunaEclipseVEVO"}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Must follow strict alphanumeric format with the uppercase <code>VEVO</code> suffix.
                </p>
              </div>

              {/* Live Handle Preview Banner */}
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-red-500">
                  <span className="flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5" />
                    <span>Live YouTube Destination Preview:</span>
                  </span>
                  <Badge className="bg-red-500 text-white text-[10px] py-0 px-1.5">Live Preview</Badge>
                </div>
                <div className="text-xs font-mono text-foreground font-semibold truncate">
                  {generatedHandle ? (
                    <span className="text-foreground">
                      https://youtube.com/@<strong className="text-red-500 font-bold">{generatedHandle}</strong>
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Type artist name to view live handle preview...</span>
                  )}
                </div>
              </div>

              {/* Social Verification Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="spotifyUrl" className="text-xs">Spotify Artist Profile URL</Label>
                  <Input
                    id="spotifyUrl"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="instagramUrl" className="text-xs">Instagram Profile URL</Label>
                  <Input
                    id="instagramUrl"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">Artist Video Notes &amp; Planned Release (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding the upcoming music video premiere date, ISRC, and director credits..."
                  className="w-full min-h-[70px] text-xs shadow-xs"
                />
              </div>

              {/* Terms acknowledgment checkbox */}
              <div className="flex items-start gap-2.5 pt-2 border-t border-border/50">
                <Checkbox
                  id="agreeTerms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
                  className="mt-0.5"
                />
                <label htmlFor="agreeTerms" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                  I certify that I represent this artist and hold exclusive master video rights. I agree to comply with VEVO content delivery guidelines and understand provisioning takes 24–48 hours.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="text-xs h-8.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !agreedToTerms}
                  className="text-xs h-8.5 bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting to VEVO...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Submit VEVO Request</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
