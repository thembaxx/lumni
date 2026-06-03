import { Skeleton } from "@/components/ui/skeleton";

export { FormSkeleton } from "./form-skeleton";
export { PageSkeleton } from "./page-skeleton";

export function CardSkeleton() {
	return <Skeleton className="h-32 rounded-xl" />;
}
