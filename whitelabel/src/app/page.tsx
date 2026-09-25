import React from "react";
import Link from "next/link";
import { meAction } from "@/actions/auth/me.action";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";
import { WhiteLabelUserRole } from "@/types/user";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import {
  ShieldCheck,
  Smartphone,
  Users,
  Globe,
  Sparkles,
  Radio,
  Mail,
  Phone,
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

import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const [meRes, tenantRes] = await Promise.all([meAction(), getTenantAction()]);

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

  return (
    <PortalLayoutWrapper>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Hero Welcome Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border border-border/60 shadow-xl bg-card"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15 0%, rgba(0,0,0,0) 100%)`,
          }}
        >
          <div className="relative z-10 max-w-3xl">
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
                "Manage your music releases, sound recording deliveries, streaming royalties, and team members seamlessly."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                render={<Link href="/sessions" />}
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-1.5 h-8.5 bg-background shadow-xs"
              >
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <span>Active Sessions</span>
              </Button>
              {isManagement && (
                <Button
                  render={<Link href="/users" />}
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold gap-1.5 h-8.5 bg-background shadow-xs"
                >
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Team &amp; Roster</span>
                </Button>
              )}
            </div>
          </div>

          {/* Decorative background glow */}
          <div
            className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        {/* Core KPI & Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. User Profile & Authority Card */}
          <Card className="border-border/70 shadow-xs bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Account
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold font-mono"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  {user?.role || "ARTIST"}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-1">
                {user?.firstName} {user?.lastName}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground truncate">
                {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Member Code:</span>
                <span className="font-mono font-medium">
                  {user?.code || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Security Status:</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user?.twoFactorEnabled ? "2FA Active" : "Standard Password"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Member Since:</span>
                <span className="font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Active"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Portal Workspace Infrastructure */}
          <Card className="border-border/70 shadow-xs bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Portal Node
                </span>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-1 truncate">
                {tenant?.name || "Music Portal"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground truncate font-mono">
                {tenant?.domain?.platformSubdomainFqdn ||
                  (tenant?.subdomain
                    ? `${tenant.subdomain}.platform.royalmotionit.com`
                    : "Private Node")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Tenant Code:</span>
                <span className="font-mono font-medium">
                  {tenant?.code || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  DNS &amp; Routing:
                </span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {tenant?.elasticIpv4
                    ? `A-Record (${tenant.elasticIpv4})`
                    : "Automated Proxy"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Business Entity:</span>
                <span className="font-medium">
                  {tenant?.businessType?.replace(/_/g, " ") || "Record Label"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Catalog Delivery Telemetry */}
          <Card className="border-border/70 shadow-xs bg-card flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Catalog Telemetry
                </span>
                <Radio className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-1">
                Streaming Pipeline
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Lossless audio delivery to 150+ DSPs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Active Tracks:</span>
                <span className="font-mono font-bold text-foreground">
                  {tenant?.catalogTrackCount || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">
                  Monthly Ingestion:
                </span>
                <span className="font-mono font-medium">
                  {tenant?.monthlyTrackDelivery || "Live Ingestion"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">
                  Audio Transcoding:
                </span>
                <span className="font-medium text-primary">
                  24-Bit FLAC / Lossless
                </span>
              </div>
            </CardContent>
          </Card>
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
