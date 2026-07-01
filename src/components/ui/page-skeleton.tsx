import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const PageSkeleton = memo(function PageSkeleton({
  rich,
}: {
  rich?: boolean;
} = {}) {
  if (rich) {
    return (
      <div className="flex flex-col gap-4 p-6 animate-pulse">
        <Skeleton className="h-5 w-36 rounded" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-[30vh] items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="size-5 animate-spin rounded-full border-2 border-system-accent/30 border-t-system-accent" />
      </div>
    </div>
  );
});
