import { Suspense } from "react";
import { CreateReleaseContent } from "./create-release-content";

export const metadata = {
  title: "New Music Release | WhiteLabel Portal",
  description: "Create and submit a music release with lossless audio and artwork.",
};

export default function NewReleasePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <CreateReleaseContent />
    </Suspense>
  );
}
