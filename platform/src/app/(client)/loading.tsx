import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ClientLoading() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in-50 duration-200">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-8 w-60 sm:w-80" />
          <Skeleton className="h-4 w-72 sm:w-112" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Main Content Card Skeleton */}
      <Card className="glass-card shadow-md border-border/80 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>

          <Skeleton className="h-16 w-full rounded-xl" />

          {/* Stepper Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Secondary Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card shadow-sm border-border/80 p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </Card>
        <Card className="glass-card shadow-sm border-border/80 p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </Card>
      </div>
    </div>
  );
}
