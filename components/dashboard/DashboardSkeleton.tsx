import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {/* Gross Income — hero, 2 cols */}
      <div className="col-span-2 rounded-[14px] border border-border bg-card p-5">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-9 w-40 mb-4" />
        <div className="flex gap-8 pt-4 border-t border-border">
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* Lab Fees — 1 col */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <Skeleton className="h-3 w-20 mb-4" />
        <Skeleton className="h-6 w-20" />
      </div>

      {/* Commission — 1 col */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-6 w-20" />
      </div>

      {/* Overhead — 2 cols */}
      <div className="col-span-2 rounded-[14px] border border-border bg-card p-[18px]">
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-6 w-24 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-border last:border-b-0">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Net Profit — 2 cols */}
      <div className="col-span-2 rounded-[14px] border border-border bg-card p-[18px]">
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Chart — 4 cols */}
      <div className="col-span-4 rounded-[14px] border border-border bg-card p-[18px]">
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-[240px] w-full" />
      </div>
    </div>
  );
}
