export function CardSkeleton() {
	return <div className="h-32 animate-pulse rounded-xl bg-muted/30" />;
}

export function PageSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="h-8 w-48 animate-pulse rounded bg-muted/30" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<CardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}

export function FormSkeleton() {
	return (
		<div className="mx-auto flex max-w-md flex-col gap-8 p-6">
			<div className="space-y-2">
				<div className="h-8 w-40 animate-pulse rounded bg-muted/30" />
				<div className="h-4 w-56 animate-pulse rounded bg-muted/30" />
			</div>
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="space-y-1.5">
						<div className="h-3 w-16 animate-pulse rounded bg-muted/30" />
						<div className="h-11 w-full animate-pulse rounded-xl bg-muted/30" />
					</div>
				))}
			</div>
			<div className="h-11 w-full animate-pulse rounded-xl bg-muted/30" />
		</div>
	);
}
