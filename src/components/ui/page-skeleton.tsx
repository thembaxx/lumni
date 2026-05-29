export function PageSkeleton() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="h-8 w-48 animate-pulse rounded bg-muted/30" />
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
	return <div className="h-32 animate-pulse rounded-xl bg-muted/30" />;
}
