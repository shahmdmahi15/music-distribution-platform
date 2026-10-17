import { Suspense } from "react";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { ReleaseDetailsContent } from "./release-details-content";

export const metadata = {
  title: "Release Details | WhiteLabel Music Portal",
  description: "View and manage music release tracks, audio playback, and DSP status.",
};

export default async function ReleaseDetailsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <PortalLayoutWrapper>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <ReleaseDetailsContent code={code} />
      </Suspense>
    </PortalLayoutWrapper>
  );
}
