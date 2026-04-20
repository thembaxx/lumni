import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background">
			<main className="flex flex-col items-center gap-8">
				<Skeleton className="h-16 w-48 rounded-full" />
				<Skeleton className="h-4 w-64 rounded-full" />
				<div className="flex flex-col items-center gap-4 w-full max-w-xs">
					<Skeleton className="h-1 w-full rounded-full" />
					<Skeleton className="h-10 w-32 rounded-full" />
				</div>
			</main>
		</div>
	);
}
