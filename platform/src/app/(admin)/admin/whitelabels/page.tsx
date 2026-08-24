import { adminGetWhiteLabelsAction } from "@/actions/admin/whitelabel/admin-get-whitelabels.action";
import { AdminWhiteLabelsTable } from "@/components/admin/whitelabel/admin-whitelabels-table";
import { Badge } from "@/components/ui/badge";
import { Disc3, Sparkles } from "lucide-react";

export default async function AdminWhiteLabelsPage() {
  const data = await adminGetWhiteLabelsAction();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-xs font-semibold border-primary/30 bg-primary/10 text-primary gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Partner Ecosystem
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Disc3 className="h-7 w-7 text-primary" />
            WhiteLabel Instances & Applications
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Review incoming enterprise WhiteLabel applications, inspect catalog telemetry, record offline/manual payments, and activate branded tenant distribution instances.
          </p>
        </div>
      </div>

      {/* Main Interactive Management Table */}
      <AdminWhiteLabelsTable initialData={data} />
    </div>
  );
}
