import { operationalAction } from "@/actions/system/operational.action";
import { Music, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { operational } = await operationalAction();
  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 w-full">
      {/* Left Column - Hero/Branding (visible on lg+) */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 overflow-hidden border-r border-border bg-card">
        {/* Glowing atmospheric circles using theme secondary/primary values */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="relative z-10 flex items-center gap-2.5 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg group-hover:scale-105 transition-all duration-300">
            <Music className="h-5 w-5" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            RoyalMotionIT
          </span>
        </Link>

        {/* Feature showcase / Visual mock */}
        <div className="relative z-10 my-auto flex flex-col gap-8 max-w-md">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" /> Empowering WhiteLabels
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight bg-linear-to-b from-foreground to-muted-foreground bg-clip-text">
              Distribute your music worldwide.
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Keep 100% of your earnings. Upload your tracks to Spotify, Apple
              Music, TikTok, and over 150 stores globally in minutes.
            </p>
          </div>

          {/* Interactive look Music player mock */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-background/40 p-6 backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 blur-2xl rounded-full" />
            <div className="flex items-center gap-4">
              {/* Rotating Record Album Art */}
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden border border-border shadow-inner group">
                <div className="absolute inset-0 bg-linear-to-tr from-background to-muted" />
                <div className="absolute inset-2 rounded-full border border-dashed border-border/50 animate-[spin_10s_linear_infinite]" />
                <div className="absolute h-3 w-3 rounded-full bg-background border border-border z-10" />
                <div className="absolute inset-0 bg-linear-to-t from-primary/10 to-accent/10 mix-blend-overlay" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-1.5 w-12 bg-primary/20 rounded-full mb-2 border border-primary/30" />
                <h3 className="text-sm font-semibold text-foreground truncate">
                  Say Yes To Heaven
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  Lana Del Rey
                </p>
              </div>
            </div>
            {/* Waveform Visualization Mock */}
            <div className="mt-5 flex items-end gap-0.5 h-6 px-1">
              {[
                0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.7, 0.5, 0.8, 0.9, 0.4, 0.7,
                0.6, 0.8, 0.5, 0.3, 0.9, 0.7, 0.6, 0.5, 0.8, 0.4, 0.7, 0.5, 0.9,
                0.3,
              ].map((val, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-muted transition-all duration-300"
                  style={{
                    height: `${val * 100}%`,
                    backgroundColor: i < 11 ? "var(--primary)" : "",
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground/80 font-mono">
              <span>01:14</span>
              <span>03:45</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-muted-foreground/75 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} RoyalMotionIT</span>
          {operational ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              All systems down
            </span>
          )}
        </div>
      </div>

      {/* Right Column - Children Pages (Login, register, etc.) */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
        {/* Glow behind forms */}
        <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-75 sm:w-125 h-75 sm:h-125 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        {/* Small screen brand logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Music className="h-4 w-4" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-foreground">
            RoyalMotionIT
          </span>
        </div>

        {/* Main card wrapper for forms */}
        <div className="w-full max-w-105 relative z-10">{children}</div>
      </div>
    </div>
  );
}
