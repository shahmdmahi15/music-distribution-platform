/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Globe2,
  Disc3,
  Layers,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { TenantLogo } from "@/components/tenant-logo";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantRes = await getTenantAction();
  const tenant = tenantRes.tenant;

  const dspPartners = [
    { name: "Spotify", tag: "Direct Delivery" },
    { name: "Apple Music", tag: "Lossless" },
    { name: "YouTube Music", tag: "Content ID" },
    { name: "Amazon Music", tag: "HD Audio" },
    { name: "Tidal & Deezer", tag: "Hi-Res" },
  ];

  const securityPoints = [
    {
      title: "Bank-Grade Encryption",
      desc: "256-bit TLS transmission with Argon2id cryptographic hashing.",
      icon: Lock,
    },
    {
      title: "Direct DSP Delivery",
      desc: "Automated ingestion pipeline to 150+ digital streaming services.",
      icon: Globe2,
    },
    {
      title: "Transparent Royalties",
      desc: "Real-time earnings accounting with granular streaming ledgers.",
      icon: Layers,
    },
  ];

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full overflow-hidden flex flex-col lg:grid lg:grid-cols-12 bg-background selection:bg-primary/20">
      {/* Left Column - Enterprise Trust & Distribution Infrastructure (visible on lg+) */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-6 xl:p-8 2xl:p-10 overflow-hidden border-r border-border/70 bg-muted/20 h-full">
        {/* Subtle background ambient gradients */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none" />

        {/* Brand Logo & Name */}
        <div className="relative z-10 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <TenantLogo
              tenant={tenant}
              className="h-9 xl:h-10 w-auto object-contain rounded-xl group-hover:scale-105 transition-all duration-300"
              fallbackContainerClassName="flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-xl text-white shadow-md group-hover:scale-105 transition-all duration-300"
              fallbackIconClassName="h-5 w-5 xl:h-6 xl:w-6"
            />
            <div>
              <span className="font-heading font-bold text-lg xl:text-xl tracking-tight text-foreground block leading-none">
                {tenant?.name || "Music Portal"}
              </span>
              <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                {tenant?.businessType?.replace(/_/g, " ") ||
                  "Music Distribution Portal"}
              </span>
            </div>
          </Link>
        </div>

        {/* Hero Narrative & Trust Pillars */}
        <div className="relative z-10 my-auto flex flex-col gap-4 xl:gap-6 max-w-lg py-2">
          <div className="space-y-2 xl:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/25 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Music Rights &amp; Delivery Node</span>
            </div>
            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-foreground leading-[1.2]">
              {tenant?.tagline ||
                "Professional catalog delivery & royalty infrastructure."}
            </h1>
            <p className="text-muted-foreground text-xs xl:text-sm leading-relaxed line-clamp-2 xl:line-clamp-3">
              {tenant?.description ||
                "Distribute your sound recordings directly to all major streaming platforms with lossless audio fidelity, automated routing, and enterprise security."}
            </p>
          </div>

          {/* Trust Guarantees Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {securityPoints.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2.5 xl:p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs transition-all hover:border-border hover:bg-card/90"
                >
                  <div
                    className="p-1.5 rounded-lg shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      {item.title}
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verified Delivery DSP Partner Tags */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
              Direct Global Ingestion Channels
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dspPartners.map((dsp, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[10px] xl:text-[11px] px-2 py-0.5 rounded-md border border-border/80 bg-card/70 text-foreground font-medium"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {dsp.name}
                  <span className="text-[9px] text-muted-foreground font-mono">
                    ({dsp.tag})
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info & System Telemetry */}
        <div className="relative z-10 text-xs text-muted-foreground flex items-center justify-between pt-3 border-t border-border/60 shrink-0">
          <span className="font-mono text-[10px] xl:text-[11px]">
            {tenant?.copyrightText ||
              `© ${new Date().getFullYear()} ${tenant?.name || "WhiteLabel"}`}
          </span>
          <div className="flex items-center gap-2">
            {tenant?.country && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <Globe2 className="h-3 w-3" />
                {tenant.country}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px] xl:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Node active
            </span>
          </div>
        </div>
      </div>

      {/* Right Column - Auth Card Container */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative overflow-hidden bg-background h-full">
        {/* Glow behind forms */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
          <ThemeToggle />
        </div>

        {/* Small screen brand logo */}
        <div className="lg:hidden absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-2">
          <TenantLogo
            tenant={tenant}
            className="h-8 w-auto object-contain rounded-lg"
            fallbackContainerClassName="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm"
            fallbackIconClassName="h-4 w-4"
          />
          <div>
            <span className="font-heading font-bold text-sm tracking-tight text-foreground block leading-none">
              {tenant?.name || "Music Portal"}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase">
              Distribution Portal
            </span>
          </div>
        </div>

        {/* Main card wrapper for forms */}
        <div className="w-full max-w-md relative z-10 my-auto">{children}</div>
      </div>
    </div>
  );
}
