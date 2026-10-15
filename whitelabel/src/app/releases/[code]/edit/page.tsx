import { Suspense } from "react";
import { EditReleaseContent } from "./edit-release-content";

export const metadata = {
  title: "Edit Release | WhiteLabel Music Portal",
  description: "Update release metadata, replace artwork, manage tracks, and resubmit to Mother Company.",
};

export default async function EditReleasePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <EditReleaseContent code={code} />
    </Suspense>
  );
}
