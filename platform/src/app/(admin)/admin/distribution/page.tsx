import { Suspense } from "react";
import { AdminDistributionContent } from "./distribution-content";

export const metadata = {
  title: "Distribution Releases | Mother Company Admin",
  description:
    "Review, inspect, download, and publish WhiteLabel music releases to DSPs.",
};

export default function AdminDistributionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <AdminDistributionContent />
    </Suspense>
  );
}
