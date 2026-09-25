import { adminGetWhiteLabelsAction } from "@/actions/admin/whitelabel/admin-get-whitelabels.action";
import { AdminWhiteLabelsTable } from "@/components/admin/whitelabel/admin-whitelabels-table";
import { Badge } from "@/components/ui/badge";
import {
  Disc3,
  Globe,
  ShieldCheck,
  Sparkles,
  FileCheck2,
} from "lucide-react";

export default async function AdminWhiteLabelsPage() {
  const data = await adminGetWhiteLabelsAction({ limit: 100 });

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Enterprise Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[11px] font-bold border-primary/40 bg-primary/10 text-primary gap-1.5"
            >
              <Sparkles className="h-3 w-3" />
              Enterprise Partner Ecosystem
            </Badge>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
            >
              <Globe className="h-3 w-3" />
              Cloudflare Auto-DNS Engine
            </Badge>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[10px] font-mono border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              DDEX ERN 4.3 / CWR v2.1 KYB
            </Badge>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-[10px] font-mono border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1"
            >
              <FileCheck2 className="h-3 w-3" />
              S3 Encrypted Legal Vault
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Disc3 className="h-7 w-7 text-primary shrink-0" />
            WhiteLabel Partner Command Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            End-to-end enterprise governance for Record Labels, Distributors,
            Music Publishers, and Talent Agencies—featuring KYB compliance
            scoring, full dossier editing, S3 contract management, subscription
            billing ledgers, and automated Cloudflare DNS tenant provisioning.
          </p>
        </div>
      </div>

      {/* Main Interactive Management System */}
      <AdminWhiteLabelsTable initialData={data} />
    </div>
  );
}
