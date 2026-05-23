export function QuestionCardSkeleton() {
	return (
		<div className="w-full max-w-2xl">
			<div className="flex flex-col gap-6">
				{/* Header Skeleton */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="h-2 w-10 rounded bg-muted/50"></div>
						<div className="h-2 w-6 rounded bg-muted/50"></div>
						<div className="h-2 w-6 rounded bg-muted/50"></div>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-6 rounded bg-muted/50"></div>
						<div className="h-2 w-6 rounded bg-muted/50"></div>
						<div className="h-2 w-6 rounded bg-muted/50"></div>
					</div>
				</div>
				<div className="h-4 w-32 rounded bg-muted/50"></div>

				{/* Media Skeleton (if applicable) */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<div className="h-2 w-16 rounded bg-muted/50"></div>
						<button
							type="button"
							className="flex h-8 w-20 items-center justify-center rounded bg-muted/50"
						>
							<div className="size-4 rounded bg-muted/300"></div>
						</button>
					</div>
					<div className="flex flex-col gap-2">
						<div className="h-2 w-24 rounded bg-muted/50"></div>
						<div className="h-2 w-24 rounded bg-muted/50"></div>
					</div>
				</div>

				{/* Content Skeleton */}
				<div className="flex flex-col gap-4">
					<div className="h-4 w-48 rounded bg-muted/50"></div>
					<div className="h-4 w-64 rounded bg-muted/50"></div>
					<div className="h-4 w-72 rounded bg-muted/50"></div>
				</div>

				{/* Input Skeleton (varies by question type, but we show a generic one) */}
				<div className="flex flex-col gap-4">
					{/* For MCQ: show two options */}
					<div className="grid grid-cols-2 gap-2">
						<div className="h-10 rounded bg-muted/50"></div>
						<div className="h-10 rounded bg-muted/50"></div>
						<div className="h-10 rounded bg-muted/50"></div>
						<div className="h-10 rounded bg-muted/50"></div>
					</div>
					<div className="h-10 w-full rounded bg-muted/50"></div>
				</div>

				{/* Feedback Skeleton */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<div className="size-4 rounded bg-muted/50"></div>
						<div className="size-4 rounded bg-muted/50"></div>
					</div>
					<div className="flex flex-col gap-2">
						<div className="h-2 w-16 rounded bg-muted/50"></div>
						<div className="h-2 w-24 rounded bg-muted/50"></div>
					</div>
					<div className="h-2 w-24 rounded bg-muted/50"></div>
					<div className="h-2 w-24 rounded bg-muted/50"></div>
					<div className="h-2 w-24 rounded bg-muted/50"></div>
				</div>

				{/* Controls Skeleton */}
				<div className="flex items-center justify-between">
					<div className="h-8 w-24 rounded bg-muted/50"></div>
					<div className="h-8 w-24 rounded bg-muted/50"></div>
				</div>
			</div>
		</div>
	);
}
