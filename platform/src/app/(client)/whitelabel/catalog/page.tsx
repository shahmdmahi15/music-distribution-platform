import { Suspense } from "react";
import { ClientCatalogContent } from "./catalog-content";

export const metadata = {
  title: "Catalog Submissions | WhiteLabel Client Console",
  description:
    "Review, inspect pre-flight Quality Control, and approve artist music submissions for Mother Company DSP distribution.",
};

export default function ClientCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ClientCatalogContent />
    </Suspense>
  );
}
