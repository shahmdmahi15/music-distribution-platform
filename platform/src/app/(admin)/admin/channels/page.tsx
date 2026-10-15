import { Suspense } from "react";
import { AdminChannelsContent } from "./channels-content";

export const metadata = {
  title: "VEVO Channels | Mother Company Admin",
  description:
    "Review, inspect, and dispatch WhiteLabel VEVO YouTube channel requests to ANS Music upstream.",
};

export default function AdminChannelsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <AdminChannelsContent />
    </Suspense>
  );
}
