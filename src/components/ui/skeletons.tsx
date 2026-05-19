export function CardSkeleton() {
	return <div className="h-32 rounded-xl bg-muted/30 animate-pulse" />;
}

export function PageSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="h-8 w-48 rounded bg-muted/30 animate-pulse" />
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
		<div className="flex flex-col gap-8 p-6 max-w-md mx-auto">
			<div className="space-y-2">
				<div className="h-8 w-40 rounded bg-muted/30 animate-pulse" />
				<div className="h-4 w-56 rounded bg-muted/30 animate-pulse" />
			</div>
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="space-y-1.5">
						<div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
						<div className="h-11 w-full rounded-xl bg-muted/30 animate-pulse" />
					</div>
				))}
			</div>
			<div className="h-11 w-full rounded-xl bg-muted/30 animate-pulse" />
		</div>
	);
}
