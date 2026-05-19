export function QuestionCardSkeleton() {
	return (
		<div className="w-full max-w-2xl">
			<div className="space-y-6">
				{/* Header Skeleton */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="h-2 w-10 bg-muted/50 rounded"></div>
						<div className="h-2 w-6 bg-muted/50 rounded"></div>
						<div className="h-2 w-6 bg-muted/50 rounded"></div>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-6 bg-muted/50 rounded"></div>
						<div className="h-2 w-6 bg-muted/50 rounded"></div>
						<div className="h-2 w-6 bg-muted/50 rounded"></div>
					</div>
				</div>
				<div className="h-4 w-32 bg-muted/50 rounded"></div>

				{/* Media Skeleton (if applicable) */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="h-2 w-16 bg-muted/50 rounded"></div>
						<button className="h-8 w-20 bg-muted/50 rounded flex items-center justify-center">
							<div className="h-4 w-4 bg-muted/300 rounded"></div>
						</button>
					</div>
					<div className="space-y-2">
						<div className="h-2 w-24 bg-muted/50 rounded"></div>
						<div className="h-2 w-24 bg-muted/50 rounded"></div>
					</div>
				</div>

				{/* Content Skeleton */}
				<div className="space-y-4">
					<div className="h-4 w-48 bg-muted/50 rounded"></div>
					<div className="h-4 w-64 bg-muted/50 rounded"></div>
					<div className="h-4 w-72 bg-muted/50 rounded"></div>
				</div>

				{/* Input Skeleton (varies by question type, but we show a generic one) */}
				<div className="space-y-4">
					{/* For MCQ: show two options */}
					<div className="grid gap-2 grid-cols-2">
						<div className="h-10 bg-muted/50 rounded"></div>
						<div className="h-10 bg-muted/50 rounded"></div>
						<div className="h-10 bg-muted/50 rounded"></div>
						<div className="h-10 bg-muted/50 rounded"></div>
					</div>
					<div className="h-10 w-full bg-muted/50 rounded"></div>
				</div>

				{/* Feedback Skeleton */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 bg-muted/50 rounded"></div>
						<div className="h-4 w-4 bg-muted/50 rounded"></div>
					</div>
					<div className="space-y-2">
						<div className="h-2 w-16 bg-muted/50 rounded"></div>
						<div className="h-2 w-24 bg-muted/50 rounded"></div>
					</div>
					<div className="h-2 w-24 bg-muted/50 rounded"></div>
					<div className="h-2 w-24 bg-muted/50 rounded"></div>
					<div className="h-2 w-24 bg-muted/50 rounded"></div>
				</div>

				{/* Controls Skeleton */}
				<div className="flex items-center justify-between">
					<div className="h-8 w-24 bg-muted/50 rounded"></div>
					<div className="h-8 w-24 bg-muted/50 rounded"></div>
				</div>
			</div>
		</div>
	);
}
