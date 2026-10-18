import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { meAction } from "@/actions/auth/me.action";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";
import {
  wlGetReleasesAction,
  getVevoChannelsAction,
} from "@/actions/catalog/whitelabel-catalog.action";
import { WhiteLabelUserRole } from "@/types/user";
import { Release, ReleaseStatus } from "@/types/catalog";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Users,
  Globe,
  Sparkles,
  Radio,
  Mail,
  Phone,
  Music,
  Plus,
  FileText,
  FileBarChart,
  Scale,
  TrendingUp,
  Disc3,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const [meRes, tenantRes, releasesRes, channelsRes] = await Promise.all([
    meAction(),
    getTenantAction(),
    wlGetReleasesAction({ limit: 5 }),
    getVevoChannelsAction().catch(() => ({ success: false, channels: [] })),
  ]);

  const user = meRes.user;
  const tenant = tenantRes.tenant;

  if (!user) {
    redirect("/auth/login");
  }

  const isManagement =
    user?.role &&
    [
      WhiteLabelUserRole.OWNER,
      WhiteLabelUserRole.PARTNER,
      WhiteLabelUserRole.ADMIN,
      WhiteLabelUserRole.MANAGER,
    ].includes(user.role);

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  const releases: Release[] = releasesRes.data || [];
  const vevoChannels = channelsRes.channels || [];
  const primaryVevo = vevoChannels[0];

  // Active Catalog Deliveries Stats Breakdown
  const distributedCount = releases.filter(
    (r) => r.status === "DISTRIBUTED" || r.status === "APPROVED",
  ).length;
  const inReviewCount = releases.filter(
    (r) => r.status === "IN_REVIEW" || r.status === "SUBMITTED",
  ).length;
  const draftCount = releases.filter((r) => r.status === "DRAFT").length;
  const totalCatalogTracks =
    tenant?.catalogTrackCount ||
    releases.reduce((sum, r) => sum + (r.trackCount || 1), 0);

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PortalLayoutWrapper>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Hero Welcome Banner */}
        <Card
          className="relative overflow-hidden rounded-2xl p-0 border border-border/60 shadow-xl bg-card"
          style={{
            background: tenant?.bannerUrl
              ? `linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.95) 100%), url(${tenant.bannerUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${primaryColor}18 0%, rgba(0,0,0,0) 100%)`,
          }}
        >
          <CardContent className="relative z-10 max-w-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className="text-[11px] font-semibold gap-1.5 px-2.5 py-0.5"
                style={{
                  borderColor: `${primaryColor}40`,
                  color: primaryColor,
                }}
              >
                <Sparkles className="h-3 w-3" />
                <span>{tenant?.name || "Music Distribution Portal"}</span>
              </Badge>
              {tenant?.country && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {tenant.country}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.firstName || "Artist"}!
            </h1>
            <p className="mt-1.5 text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-2xl">
              {tenant?.description ||
                tenant?.tagline ||
                "Manage your music catalog, sound recording deliveries, streaming royalties, and team members seamlessly."}
            </p>
          </CardContent>

          {/* Decorative background glow */}
          <div
            className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />
        </Card>

        {/* Pinned Quick Actions Bar */}
        <Card className="border border-border/70 bg-card/80 backdrop-blur-md shadow-xs">
          <CardContent className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Quick Actions</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/releases/new">
                <Button size="sm" className="text-xs font-semibold gap-1.5 shadow-sm">
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Create Release</span>
                </Button>
              </Link>

              <Link href="/channels">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold gap-1.5 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 shadow-xs"
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Request VEVO Channel</span>
                </Button>
              </Link>

              <Link href="/channels">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold gap-1.5 bg-background shadow-xs hover:border-primary/40"
                >
                  <Scale className="h-3.5 w-3.5 text-primary" />
                  <span>Add Payee / Split</span>
                </Button>
              </Link>

              <Link href="/reports">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold gap-1.5 bg-background shadow-xs hover:border-primary/40"
                >
                  <FileBarChart className="h-3.5 w-3.5 text-primary" />
                  <span>Royalty Statements</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Rich KPI Cards with Trend Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Gross & Net Royalties Card */}
          <Card className="border-border/70 shadow-xs bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Royalties Balance
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  <TrendingUp className="h-3 w-3" />
                  +14.2%
                </span>
              </div>
              <CardTitle className="text-lg font-bold text-foreground mt-1 flex items-baseline justify-between">
                <span>$14,820.50</span>
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  ৳1,778,460 BDT
                </span>
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Gross Earnings (Monthly Cycle)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Net Payee Balance:</span>
                <span className="font-semibold text-emerald-500 font-mono">
                  $12,597.42 <span className="text-[10px] text-muted-foreground font-normal">(৳1.51M)</span>
                </span>
              </div>
              {/* Mini Sparkline Curve */}
              <div className="pt-2">
                <div className="h-8 w-full flex items-end gap-1">
                  {[35, 45, 40, 60, 55, 70, 65, 80, 75, 90, 85, 100].map(
                    (val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-xs bg-primary/25 hover:bg-primary transition-colors"
                        style={{ height: `${val}%` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Streaming Velocity Card */}
          <Card className="border-border/70 shadow-xs bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Streaming Velocity
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                  <ArrowUpRight className="h-3 w-3" />
                  +8.7%
                </span>
              </div>
              <CardTitle className="text-lg font-bold text-foreground mt-1">
                1,842,910
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Total Streams Across DSPs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Spotify:</span>
                  <span className="font-mono font-medium">1,045,200 (56%)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Apple Music:</span>
                  <span className="font-mono font-medium">498,310 (28%)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">YouTube & VEVO:</span>
                  <span className="font-mono font-medium">299,400 (16%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Active Catalog Deliveries Card */}
          <Card className="border-border/70 shadow-xs bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Catalog Deliveries
                </span>
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground mt-1">
                {totalCatalogTracks} Tracks
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Distribution Pipeline Health
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Distributed: {distributedCount}
                </span>
                <span className="text-amber-500 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  In Review: {inReviewCount}
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  Drafts: {draftCount}
                </span>
              </div>
              {/* Proportional Segment Bar */}
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${Math.max(15, (distributedCount / Math.max(1, releases.length)) * 100)}%`,
                  }}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{
                    width: `${Math.max(10, (inReviewCount / Math.max(1, releases.length)) * 100)}%`,
                  }}
                />
                <div className="bg-zinc-600 h-full flex-1" />
              </div>
            </CardContent>
          </Card>

          {/* 4. Account Security Status Card */}
          <Card className="border-border/70 shadow-xs bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Security & Sessions
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold font-mono"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  {user?.role || "ARTIST"}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-1 truncate">
                {user?.firstName} {user?.lastName}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground truncate">
                {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">2FA Auth:</span>
                <span
                  className={`font-medium flex items-center gap-1 ${
                    user?.twoFactorEnabled ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {user?.twoFactorEnabled ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      2FA Protected
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Standard Security
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Active Sessions:</span>
                <Link
                  href="/sessions"
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Smartphone className="h-3 w-3" />
                  <span>1 Active Session</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Official VEVO & Channel Status Card */}
        <Card className="border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-card to-card shadow-xs">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-500 shrink-0 mt-0.5">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold">
                    Official VEVO &amp; YouTube Channel Network
                  </h3>
                  {primaryVevo ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[10px]"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      APPROVED
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[10px]"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      CHANNEL LINKED
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  VEVO Handle:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {primaryVevo?.channelName || `${user?.firstName || "Artist"}VEVO`}
                  </span>
                  {" • "}Direct monetization &amp; VEVO banner branding enabled.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {primaryVevo?.channelUrl && (
                <a
                  href={primaryVevo.channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-accent transition-colors"
                >
                  <span>View on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <Link href="/channels">
                <Button size="sm" variant="outline" className="text-xs border-rose-500/40 text-rose-500 hover:bg-rose-500/10">
                  <span>Manage Channels</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Releases Catalog Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Recent Releases</h2>
              <p className="text-xs text-muted-foreground">
                Snapshot of latest musical works submitted to Mother Company &amp; DSPs
              </p>
            </div>

            <Link
              href="/releases"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View All Releases</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {releases.length === 0 ? (
            <Card className="border-dashed border-border/80 bg-card/40">
              <CardContent className="p-8">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Disc3 className="w-6 h-6 text-muted-foreground/70 animate-spin-slow" />
                    </EmptyMedia>
                    <EmptyTitle>No releases yet</EmptyTitle>
                    <EmptyDescription>
                      Launch your music to Spotify, Apple Music, and YouTube by creating your first release dossier.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link href="/releases/new">
                      <Button size="sm" className="gap-1.5 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Release</span>
                      </Button>
                    </Link>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs">
              <CardContent className="p-0">
                <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="w-[80px]">Cover</TableHead>
                    <TableHead>Release Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Tracks</TableHead>
                    <TableHead className="hidden lg:table-cell">UPC / Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {releases.slice(0, 5).map((rel) => (
                    <TableRow key={rel.id} className="hover:bg-muted/30">
                      <TableCell className="p-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/60 border border-border/60 shrink-0">
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
                      <TableCell className="hidden md:table-cell p-3 text-xs text-muted-foreground">
                        {rel.trackCount || 1} {rel.trackCount === 1 ? "track" : "tracks"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-3 text-xs font-mono text-muted-foreground">
                        {rel.upc || rel.code}
                      </TableCell>
                      <TableCell className="p-3">
                        {getStatusBadge(rel.status)}
                      </TableCell>
                      <TableCell className="text-right p-3">
                        <Link href={`/releases/${rel.code}`}>
                          <Button size="xs" variant="outline" className="text-[11px] h-7">
                            <span>View</span>
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Support & Contacts Information */}
        {(tenant?.supportEmail || tenant?.supportPhone || tenant?.socials) && (
          <Card className="border-border/70 shadow-xs bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Official Label &amp; Support Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                {tenant?.supportEmail && (
                  <a
                    href={`mailto:${tenant.supportEmail}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>{tenant.supportEmail}</span>
                  </a>
                )}
                {tenant?.supportPhone && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>{tenant.supportPhone}</span>
                  </span>
                )}
              </div>

              {tenant?.socials && (
                <div className="flex items-center gap-3 text-muted-foreground text-xs">
                  {tenant.socials.instagram && (
                    <a
                      href={tenant.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {tenant.socials.spotify && (
                    <a
                      href={tenant.socials.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      Spotify
                    </a>
                  )}
                  {tenant.socials.youtube && (
                    <a
                      href={tenant.socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      YouTube
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayoutWrapper>
  );
}
