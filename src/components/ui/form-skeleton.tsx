import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40 rounded" />
        <Skeleton className="h-4 w-56 rounded" />
      </div>
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
