import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhiteLabel Portal Routing | RoyalMotionIT Platform",
  description: "Enterprise Music Distribution WhiteLabel Platform Gateway",
};

export default function SubdomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            R
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight">RoyalMotionIT</span>
            <span className="text-xs text-slate-400 block -mt-0.5">Platform Distribution Gateway</span>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
          Mother Platform Gateway
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} RoyalMotionIT. All rights reserved. Subdomain routing protected.
      </footer>
    </div>
  );
}
