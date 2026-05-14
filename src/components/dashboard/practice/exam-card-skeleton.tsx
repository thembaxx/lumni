import { Skeleton } from "@/components/ui/skeleton";

interface ExamCardSkeletonProps {
	className?: string;
}

export function ExamCardSkeleton({ className }: ExamCardSkeletonProps) {
	return (
		<div
			className={`flex items-center justify-between p-3 rounded-xl bg-secondary/40 border-0 ${className ?? ""}`}
		>
			<div className="flex-1 min-w-0 pr-2 flex flex-col gap-1">
				<Skeleton className="h-4 w-3/4 rounded" />
				<div className="flex items-center gap-1.5">
					<Skeleton className="h-3 w-8 rounded" />
					<Skeleton className="h-3 w-6 rounded" />
					<Skeleton className="h-[14px] w-6 rounded" />
					<Skeleton className="h-3 w-10 rounded" />
				</div>
			</div>

			<div className="flex items-center gap-1.5 shrink-0">
				<Skeleton className="h-8 w-[54px] rounded-md" />
				<Skeleton className="h-8 w-[70px] rounded-md" />
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
