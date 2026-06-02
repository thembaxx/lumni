import { Skeleton } from "@/components/ui/skeleton";

interface ExamCardSkeletonProps {
	className?: string;
}

export function ExamCardSkeleton({ className }: ExamCardSkeletonProps) {
	return (
		<div
			className={`flex items-center justify-between rounded-xl border-0 bg-secondary/40 p-3 ${className ?? ""}`}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
				<Skeleton className="h-4 w-3/4 rounded" />
				<div className="flex items-center gap-1.5">
					<Skeleton className="h-3 w-8 rounded" />
					<Skeleton className="h-3 w-6 rounded" />
					<Skeleton className="h-[14px] w-6 rounded" />
					<Skeleton className="h-3 w-10 rounded" />
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-1.5">
				<Skeleton className="h-8 w-14 rounded-md" />
				<Skeleton className="h-8 w-16 rounded-md" />
			</div>
		</div>
	);
}

interface GroupSkeletonProps {
	className?: string;
}

export function GroupSkeleton({ className }: GroupSkeletonProps) {
	return (
		<div className={`flex flex-col gap-2.5 ${className ?? ""}`}>
			<div className="flex items-center justify-between px-0.5">
				<Skeleton className="h-4 w-24 rounded" />
				<Skeleton className="h-4 w-6 rounded" />
			</div>
			<div className="grid gap-2">
				<ExamCardSkeleton />
				<ExamCardSkeleton />
				<ExamCardSkeleton />
				<ExamCardSkeleton />
			</div>
		</div>
	);
}
