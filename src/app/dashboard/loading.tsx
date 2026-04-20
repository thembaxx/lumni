import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="min-h-screen flex flex-col bg-background">
			<nav className="flex items-center justify-between px-4 py-3 w-full">
				<Skeleton className="w-10 h-10 rounded-full" />

				<div className="flex flex-col items-center space-y-4">
					<div className="flex bg-secondary/40 p-1 rounded-2xl gap-1">
						<Skeleton className="h-10 w-16 rounded-full" />
						<Skeleton className="h-10 w-16 rounded-full" />
					</div>
				</div>

				<Skeleton className="w-10 h-10 rounded-xl" />
			</nav>

			<main className="flex-1 flex flex-col items-center justify-center gap-2">
				<Skeleton className="h-8 w-32 rounded-full" />
				<Skeleton className="h-4 w-48 rounded-full" />
				<Skeleton className="h-4 w-24 rounded-full" />
			</main>

			<div className="px-4 pb-6 space-y-3">
				<div className="flex gap-2 flex-wrap">
					<Skeleton className="h-8 w-20 rounded-full" />
					<Skeleton className="h-8 w-24 rounded-full" />
					<Skeleton className="h-8 w-16 rounded-full" />
					<Skeleton className="h-8 w-28 rounded-full" />
				</div>

				<div className="flex items-center gap-2">
					<Skeleton className="w-9 h-9 rounded-full" />
					<Skeleton className="h-9 flex-1 rounded-full" />
				</div>
			</div>
		</div>
	);
}
