import { Metadata } from "next";
import { adminGetInfrastructureOverviewAction } from "@/actions/admin/infrastructure/admin-get-infrastructure-overview.action";
import { InfrastructureContent } from "./infrastructure-content";

export const metadata: Metadata = {
  title: "Infrastructure & Fleet Operations | Platform Console",
  description:
    "Live system compute metrics, process orchestration, PostgreSQL database, storage vault, AWS SES mailing, and Cloudflare Edge controls.",
};

export default async function AdminInfrastructurePage() {
  const initialOverview = await adminGetInfrastructureOverviewAction();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <InfrastructureContent initialData={initialOverview.data} />
    </div>
  );
}
