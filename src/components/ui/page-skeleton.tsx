import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<Skeleton className="h-8 w-48 rounded" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
					<CardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}

function CardSkeleton() {
	return <Skeleton className="h-32 rounded-xl" />;
}
