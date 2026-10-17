import { Suspense } from "react";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { ReleasesContent } from "./releases-content";

export const metadata = {
  title: "Releases & Catalog | WhiteLabel Music Portal",
  description: "Manage your music catalog, singles, EPs, and albums.",
};

export default function ReleasesPage() {
  return (
    <PortalLayoutWrapper>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <ReleasesContent />
      </Suspense>
    </PortalLayoutWrapper>
  );
}
