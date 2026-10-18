"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { adminGetWhiteLabelsAction } from "@/actions/admin/whitelabel/admin-get-whitelabels.action";
import { adminGetDistributionReleasesAction } from "@/actions/admin/distribution/admin-distribution.action";
import {
  Disc3,
  Disc2,
  Users,
  HeartHandshake,
  Server,
  Database,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function AdminOverviewContent() {
  const [loading, setLoading] = useState(true);
  const [wlData, setWlData] = useState<{
    total: number;
    active: number;
    pending: number;
    recent: any[];
  }>({
    total: 0,
    active: 0,
    pending: 0,
    recent: [],
  });

  const [releaseData, setReleaseData] = useState<{
    total: number;
    submitted: number;
    recent: any[];
  }>({
    total: 0,
    submitted: 0,
    recent: [],
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [wlRes, relRes] = await Promise.all([
          adminGetWhiteLabelsAction({ limit: 5 }),
          adminGetDistributionReleasesAction({ limit: 5 }),
        ]);

        if (wlRes.success) {
          setWlData({
            total: wlRes.pagination?.total || 0,
            active: wlRes.counts?.active || 0,
            pending:
              (wlRes.counts?.pending || 0) + (wlRes.counts?.underReview || 0),
            recent: wlRes.items || [],
          });
        }

        if (relRes.success) {
          const submittedCount = (relRes.data || []).filter(
            (r) => r.status === "SUBMITTED" || r.status === "IN_REVIEW",
          ).length;
          setReleaseData({
            total: relRes.meta?.total || 0,
            submitted: submittedCount,
            recent: relRes.data || [],
          });
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Banner / Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Platform Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Core Systems Online
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Mother Company Core (Central API & Platform) • BYOC Client Tenants Isolated on Client AWS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/whitelabels"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs"
          >
            <span>Review Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WhiteLabels */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                WhiteLabel Tenants
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Disc3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{loading ? "..." : wlData.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-emerald-500">{wlData.active} Active</span> •{" "}
                <span className="font-semibold text-amber-500">{wlData.pending} Pending</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Releases Pipeline */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Releases Pipeline
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Disc2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{loading ? "..." : releaseData.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-blue-500">
                  {releaseData.submitted} In Queue
                </span>{" "}
                for DSP Distribution
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure Topology */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Infrastructure
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Dual Storage & Single DB</div>
              <p className="text-xs text-muted-foreground mt-1">
                Client EC2 + BYOC S3 Vaults
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Core Services Health */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Mother Platform Health
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PostgreSQL 16</span>
                <span className="font-semibold text-emerald-500">Connected</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Redis 7 Cache</span>
                <span className="font-semibold text-emerald-500">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/whitelabels" className="block">
            <Card className="rounded-xl border-border bg-card hover:bg-accent/40 transition-colors group p-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Disc3 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                    WhiteLabels
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    Review, approve, and provision
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/distribution" className="block">
            <Card className="rounded-xl border-border bg-card hover:bg-accent/40 transition-colors group p-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Disc2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm leading-tight group-hover:text-blue-500 transition-colors">
                    Distribution Queue
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    Inspect audio & DSP delivery
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/referrers" className="block">
            <Card className="rounded-xl border-border bg-card hover:bg-accent/40 transition-colors group p-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm leading-tight group-hover:text-pink-500 transition-colors">
                    Referrer Deals
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    15% revenue share tracking
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users/platform" className="block">
            <Card className="rounded-xl border-border bg-card hover:bg-accent/40 transition-colors group p-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm leading-tight group-hover:text-amber-500 transition-colors">
                    Platform Users
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    Staff & admin RBAC access
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Two Columns: Recent Applications & Recent Releases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent WhiteLabels */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="p-6 pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="font-semibold text-base flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-primary" />
              <span>Recent WhiteLabel Applications</span>
            </CardTitle>
            <Link
              href="/admin/whitelabels"
              className="text-xs text-primary hover:underline font-medium"
            >
              View All
            </Link>
          </CardHeader>

          <CardContent className="p-6 pt-3">
            <div className="divide-y divide-border/40">
              {wlData.recent.length > 0 ? (
                wlData.recent.map((wl) => (
                  <div
                    key={wl.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {wl.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {wl.code} • {wl.customDomain ? `backstage.${wl.customDomain}` : "Custom Domain Pending"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded font-medium border border-border bg-accent text-accent-foreground">
                      {wl.status}
                    </span>
                  </div>
                ))
              ) : (
                <Empty className="py-8 px-4 border-0">
                  <EmptyMedia>
                    <Disc3 className="w-8 h-8 text-muted-foreground/40" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-sm font-semibold">No recent applications</EmptyTitle>
                    <EmptyDescription className="text-xs text-muted-foreground">
                      No WhiteLabel client onboarding applications found.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Distribution Releases */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="p-6 pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="font-semibold text-base flex items-center gap-2">
              <Disc2 className="w-4 h-4 text-blue-500" />
              <span>Distribution Releases Queue</span>
            </CardTitle>
            <Link
              href="/admin/distribution"
              className="text-xs text-primary hover:underline font-medium"
            >
              View All
            </Link>
          </CardHeader>

          <CardContent className="p-6 pt-3">
            <div className="divide-y divide-border/40">
              {releaseData.recent.length > 0 ? (
                releaseData.recent.map((rel) => (
                  <div
                    key={rel.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {rel.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {rel.code} • {rel.genre}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded font-medium border border-border bg-accent text-accent-foreground">
                      {rel.status}
                    </span>
                  </div>
                ))
              ) : (
                <Empty className="py-8 px-4 border-0">
                  <EmptyMedia>
                    <Disc2 className="w-8 h-8 text-muted-foreground/40" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-sm font-semibold">No releases in pipeline</EmptyTitle>
                    <EmptyDescription className="text-xs text-muted-foreground">
                      No audio releases currently queued for distribution.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
