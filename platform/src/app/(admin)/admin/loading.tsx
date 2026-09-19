import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in-50 duration-200">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-8 w-64 sm:w-96" />
          <Skeleton className="h-4 w-72 sm:w-128" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* KPI Stat Cards Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card shadow-sm border-border/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Bar Skeleton */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <Skeleton className="h-9 w-full max-w-md rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* Table Skeleton */}
      <Card className="glass-card shadow-sm border-border/80 overflow-hidden">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-20 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
