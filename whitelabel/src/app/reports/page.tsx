import { Suspense } from "react";
import { ReportsContent } from "./reports-content";

export const metadata = {
  title: "Reports & Monthly Statements | WhiteLabel Music Portal",
  description: "View and download monthly royalty distribution statements and stream metrics.",
};

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
