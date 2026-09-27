import { Globe, Server, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HoldingPageProps {
  searchParams: Promise<{
    name?: string;
    subdomain?: string;
    color?: string;
  }>;
}

export default async function SubdomainHoldingPage({ searchParams }: HoldingPageProps) {
  const params = await searchParams;
  const partnerName = params.name || "WhiteLabel Partner";
  const subdomain = params.subdomain || "portal";
  const primaryColor = params.color || "#6366f1";

  return (
    <div className="max-w-xl w-full mx-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative inline-flex items-center justify-center">
        <div
          className="absolute -inset-4 rounded-full opacity-30 blur-2xl animate-pulse"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
          <Globe className="w-10 h-10 text-indigo-400" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>WhiteLabel Deployment in Progress</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {partnerName}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
          This WhiteLabel portal is currently being provisioned. Custom domain routing (<span className="text-slate-200 font-mono">backstage.customdomain</span>) is being finalized.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-left space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
          <span>Assigned Platform Subdomain</span>
          <span className="font-mono text-indigo-300 font-semibold">{subdomain}.platform.royalmotionit.com</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
            <Server className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Dedicated Portal</div>
              <div className="text-slate-400 mt-0.5">Isolated tenant infrastructure active</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Custom Domain</div>
              <div className="text-slate-400 mt-0.5">Awaiting backstage DNS sync</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Link
          href="https://platform.royalmotionit.com"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors group"
        >
          <span>Return to RoyalMotionIT Platform</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
