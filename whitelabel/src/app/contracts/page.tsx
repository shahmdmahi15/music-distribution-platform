import { Suspense } from "react";
import { Metadata } from "next";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { ContractsContent } from "./contracts-content";

export const metadata: Metadata = {
  title: "Rights & Split Contracts | WhiteLabel Backstage",
  description: "Manage artist contracts, royalty split hierarchy, and payee accounts.",
};

export default function ContractsPage() {
  return (
    <PortalLayoutWrapper>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <ContractsContent />
      </Suspense>
    </PortalLayoutWrapper>
  );
}
