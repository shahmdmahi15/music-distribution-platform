import { operationalAction } from "@/actions/system/operational.action";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Globe2,
  Disc3,
  Layers,
  Sparkles,
  Server,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { operational } = await operationalAction();

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
      desc: "100% earnings pass-through with granular accounting ledgers.",
      icon: Layers,
    },
  ];

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full overflow-hidden flex flex-col lg:grid lg:grid-cols-12 bg-background selection:bg-primary/20">
      {/* Left Column - Enterprise Trust & Distribution Infrastructure (visible on lg+) */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-6 xl:p-8 2xl:p-10 overflow-hidden border-r border-border/70 bg-muted/20 h-full">
        {/* Subtle background ambient gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none" />

        {/* Brand Logo & Name */}
        <div className="relative z-10 shrink-0">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-all duration-300">
              <Disc3 className="h-5 w-5 xl:h-6 xl:w-6" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg xl:text-xl tracking-tight text-foreground block leading-none">
                RoyalMotionIT
              </span>
              <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                Music Distribution Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Hero Narrative & Trust Pillars */}
        <div className="relative z-10 my-auto flex flex-col gap-4 xl:gap-6 max-w-lg py-2">
          <div className="space-y-2 xl:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/25 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Global Music Distribution</span>
            </div>
            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-foreground leading-[1.2]">
              Professional catalog delivery & royalty infrastructure.
            </h1>
            <p className="text-muted-foreground text-xs xl:text-sm leading-relaxed line-clamp-2 xl:line-clamp-3">
              Distribute your sound recordings directly to all major streaming
              platforms with lossless audio fidelity, automated routing, and
              enterprise security.
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
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
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
            &copy; {new Date().getFullYear()} RoyalMotionIT
          </span>
          {operational ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px] xl:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Pipes operational
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[10px] xl:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Maintenance mode
            </span>
          )}
        </div>
      </div>

      {/* Right Column - Children Pages (Login, Register, MFA, Password Reset) */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative overflow-hidden bg-background h-full">
        {/* Glow behind forms */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
          <ThemeToggle />
        </div>

        {/* Small screen brand logo */}
        <div className="lg:hidden absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Disc3 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-heading font-bold text-sm tracking-tight text-foreground block leading-none">
              RoyalMotionIT
            </span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase">
              Distribution Portal
            </span>
          </div>
        </div>

        {/* Main card wrapper for forms - strictly constrained, centered */}
        <div className="w-full max-w-md relative z-10 my-auto">{children}</div>
      </div>
    </div>
  );
}
