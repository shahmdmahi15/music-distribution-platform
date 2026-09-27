import { AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface NotFoundPageProps {
  searchParams: Promise<{
    subdomain?: string;
  }>;
}

export default async function SubdomainNotFoundPage({ searchParams }: NotFoundPageProps) {
  const params = await searchParams;
  const subdomain = params.subdomain || "unknown";

  return (
    <div className="max-w-md w-full mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/10">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">
          404 &bull; Subdomain Unassigned
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Portal Not Found
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          The requested subdomain <span className="text-rose-300 font-mono font-medium">{subdomain}.platform.royalmotionit.com</span> is not registered or is not active on our platform.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 text-left flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Only authorized WhiteLabel partners with active domains are accessible. If you believe this is an error, contact your distributor administrator or support.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="https://platform.royalmotionit.com"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-all shadow-sm group"
        >
          <span>Go to Platform Console</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
