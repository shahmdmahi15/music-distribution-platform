import { adminGetReferrersAction } from "@/actions/admin/referrer/admin-get-referrers.action";
import { AdminReferrersTable } from "@/components/admin/referrer/admin-referrers-table";
import { Badge } from "@/components/ui/badge";
import {
  HeartHandshake,
  Percent,
  Landmark,
  Coins,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default async function AdminReferrersPage() {
  const data = await adminGetReferrersAction({ limit: 100 });

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Enterprise Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-amber-500/5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[11px] font-bold border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5"
            >
              <HeartHandshake className="h-3 w-3" />
              Affiliate & Referrer Network
            </Badge>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
            >
              <Percent className="h-3 w-3" />
              15% Fixed Bounty Share
            </Badge>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[10px] font-mono border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1"
            >
              <Landmark className="h-3 w-3" />
              Direct Bank & MFS Remittance
            </Badge>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[10px] font-mono border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1"
            >
              <Coins className="h-3 w-3" />
              Min ৳9,000 BDT Bounty / Deal
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <HeartHandshake className="h-7 w-7 text-amber-500 shrink-0" />
            Referrer Partner Command Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Manage your global affiliate and scout network. Referrer partners operate from{" "}
            <code className="font-mono text-foreground font-semibold">
              platform.royalmotionit.com/referrer
            </code>{" "}
            with automated 15% closed-deal bounty tracking, bank remittance dossiers (7-point banking
            or MFS wallets), signed agreements, and deal performance ledgers.
          </p>
        </div>
      </div>

      {/* Main Interactive Management System */}
      <AdminReferrersTable initialData={data} />
    </div>
  );
}
