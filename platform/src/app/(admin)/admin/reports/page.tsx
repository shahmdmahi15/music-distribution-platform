import { Suspense } from "react";
import { AdminReportsContent } from "./reports-content";

export const metadata = {
  title: "Distribution Reports & Statements | Mother Company Admin",
  description:
    "Upload and manage monthly distribution reports and royalty statements for WhiteLabel tenants.",
};

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <AdminReportsContent />
    </Suspense>
  );
}
