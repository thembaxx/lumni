import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { DictionaryClient } from "./dictionary-client";

export const metadata: Metadata = {
	title: "Dictionary - Lumni",
	description: "Look up word definitions, pronunciation, and save vocabulary",
};

export default function DictionaryPage() {
	return (
		<AppErrorBoundary>
			<Suspense
				fallback={
					<div className="flex flex-col gap-4 p-6">
						<Skeleton className="h-10 w-full rounded-xl" />
						<Skeleton className="h-32 w-full rounded-xl" />
						<Skeleton className="h-32 w-full rounded-xl" />
					</div>
				}
			>
				<DictionaryClient />
			</Suspense>
		</AppErrorBoundary>
	);
}
