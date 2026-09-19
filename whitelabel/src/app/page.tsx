import React from "react";
import Link from "next/link";
import { meAction } from "@/actions/auth/me.action";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";
import { WhiteLabelUserRole } from "@/types/user";
import {
  ShieldCheck,
  Smartphone,
  Users,
  Music,
  ArrowRight,
  Disc,
  Radio,
  Globe,
  Sparkles,
  Lock,
} from "lucide-react";

export default async function DashboardPage() {
  const [meRes, tenantRes] = await Promise.all([
    meAction(),
    getTenantAction(),
  ]);

  const user = meRes.user;
  const tenant = tenantRes.tenant;

  const isManagement =
    user?.role &&
    [
      WhiteLabelUserRole.OWNER,
      WhiteLabelUserRole.PARTNER,
      WhiteLabelUserRole.ADMIN,
      WhiteLabelUserRole.MANAGER,
    ].includes(user.role);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-border/40 shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${
            tenant?.primaryColor ? `${tenant.primaryColor}25` : "rgba(99, 102, 241, 0.15)"
          } 0%, rgba(0,0,0,0) 100%)`,
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tenant?.name || "Music Distribution Network"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
            {tenant?.description ||
              tenant?.tagline ||
              "Manage your releases, audio catalogs, royalties, and team members seamlessly."}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-card border border-border/60 hover:bg-accent transition-colors shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-primary" />
              Manage Active Sessions
            </Link>
            {isManagement && (
              <Link
                href="/users"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-card border border-border/60 hover:bg-accent transition-colors shadow-sm"
              >
                <Users className="w-4 h-4 text-primary" />
                Team & Users
              </Link>
            )}
          </div>
        </div>

        {/* Decorative background element */}
        <div
          className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
        />
      </div>

      {/* Metrics & Account Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Profile
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {user?.role}
              </span>
            </div>
            <h3 className="text-lg font-bold">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">User Code:</span>
                <span className="font-mono font-medium">{user?.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Two-Factor Auth:</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user?.twoFactorEnabled ? "Enabled" : "Not configured"}
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
            </div>
          </div>
        </div>

        {/* Portal Information */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Portal Workspace
              </span>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">{tenant?.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tenant?.subdomain
                ? `${tenant.subdomain}.platform.domain`
                : tenant?.customDomain || "Dedicated Instance"}
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Tenant Code:</span>
                <span className="font-mono font-medium">{tenant?.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Registration Policy:</span>
                <span className="font-medium uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-accent">
                  {tenant?.userSignupModel || "INVITE_ONLY"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Business Model:</span>
                <span className="font-medium">{tenant?.businessType || "RECORD_LABEL"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Sessions Overview */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Security & Devices
              </span>
              <Lock className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold">Session Protected</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-factor challenge and SHA-256 session integrity active
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Active Session ID:</span>
                <span className="font-mono text-[11px] truncate max-w-[140px]">
                  {user?.sessionId || "Current"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Last Login:</span>
                <span className="font-medium">
                  {user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : "Just now"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/sessions"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/80 transition-colors"
            >
              Inspect Active Logins
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
