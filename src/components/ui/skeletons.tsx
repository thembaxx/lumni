import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export { FormSkeleton } from "./form-skeleton";
export { PageSkeleton } from "./page-skeleton";

export const CardSkeleton = memo(function CardSkeleton() {
  return <Skeleton className="h-32 rounded-xl" />;
});
