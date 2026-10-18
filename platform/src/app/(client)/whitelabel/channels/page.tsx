import { Suspense } from "react";
import { ClientChannelsContent } from "./channels-content";

export const metadata = {
  title: "VEVO Channels Review | WhiteLabel Client Console",
  description:
    "Review and approve VEVO YouTube channel requests from your artists before upstream Mother Company provisioning.",
};

export default function ClientChannelsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ClientChannelsContent />
    </Suspense>
  );
}
