import { CardSkeleton, ListSkeleton } from "@/shared/ui/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <CardSkeleton />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border p-5">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-7 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ListSkeleton rows={3} />
        <ListSkeleton rows={3} />
      </div>
    </div>
  );
}
